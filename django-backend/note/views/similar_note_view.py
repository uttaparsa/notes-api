from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import LocalMessage, NoteChunk, NoteEmbedding, Link # Added Link
from ..serializers import SimilarNoteSerializer
import logging

logger = logging.getLogger(__name__)

class SimilarNotesView(APIView):
    """View for finding similar notes based on note ID or text input"""
    
    def get(self, request, note_id):
        """Find similar notes for a given note ID"""
        note = get_object_or_404(LocalMessage, id=note_id)
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 4))
        
        try:
            results = []
            
            # Ensure embedding exists for this note
            embedding_exists = NoteEmbedding.objects.filter(note_id=note.id).exists()
            
            if not embedding_exists:
                # Create embedding if it doesn't exist
                try:
                    NoteEmbedding.create_for_note(note)
                except Exception as e:
                    logger.error(f"Error creating embedding for note {note_id}: {str(e)}")

            # Get IDs of notes that link to the current note (backlinks)
            backlink_ids = set(Link.objects.filter(dest_message_id=note_id).values_list('source_message_id', flat=True))

            # Fetch more items to account for filtering out backlinks and ensure we can meet the limit
            # Add a small buffer (e.g., 5) in case many top similar notes are backlinks
            effective_limit = limit + len(backlink_ids) 

            # Get similar notes based on embeddings
            similar_notes_results = NoteEmbedding.find_similar_notes(note_id, limit=effective_limit)
            
            # Process and format results
            for result in similar_notes_results:
                try:
                    similar_note_id = result['note_id']
                    # Exclude if the similar note is the note itself or if it's a backlink
                    if similar_note_id == note.id or similar_note_id in backlink_ids:
                        continue

                    similar_note = LocalMessage.objects.get(id=similar_note_id)
                    distance = float(result['distance'])
                    sim_score = self._calculate_similarity_score(distance)
                    # Only include notes with reasonable similarity
                    if sim_score >= 0.65:
                        results.append({
                            'id': similar_note.id,
                            'text': similar_note.text,
                            'similarity_score': sim_score,
                            'distance': distance,
                            'is_full_note': True,
                            'created_at': similar_note.created_at,
                            'updated_at': similar_note.updated_at
                        })
                except LocalMessage.DoesNotExist:
                    continue
            
            # Sort by similarity score (higher score is better)
            results.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            # Limit to requested number
            results = results[:limit]
            
            # Serialize and return
            serializer = SimilarNoteSerializer(results, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error finding similar notes for note {note_id}: {str(e)}")
            return Response(
                {'error': f'Error finding similar notes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Find similar notes and chunks for a given text input"""
        # Get the text from the request
        text = request.data.get('text')
        if not text or len(text) < 10:
            return Response(
                {'error': 'Please provide text with at least 10 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional parameters
        limit = int(request.data.get('limit', 3))
        exclude_note_id = request.data.get('exclude_note_id')
        
        if exclude_note_id:
            exclude_note_id = int(exclude_note_id)
        
        try:
            all_found_items = self._find_similars_by_text(
                text=text,
                limit_per_type=limit, # This is the desired count for each type
                exclude_note_id=exclude_note_id
            )
            
            # Sort by similarity (higher score is better) and limit results
            all_found_items.sort(key=lambda x: x['similarity_score'], reverse=True)
            results = all_found_items[:limit] # Apply final limit
            
            # Serialize
            serializer = SimilarNoteSerializer(results, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error finding similar content for text: {str(e)}")
            return Response(
                {'error': f'Error finding similar content: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_similarity_score(self, distance):
        """Convert distance to similarity score"""
        max_distance = 4.0
        return max(0, 1 - (distance / max_distance))
    
    
    def _find_similars_by_text(self, text, limit_per_type, exclude_note_id=None): # Removed mode parameter
        """Helper method to find similar chunks and/or notes for arbitrary text"""
        all_results = []
        # Keep track of note IDs added to avoid duplicates from different sources (chunks vs full notes)
        # or multiple chunks from the same note.
        added_note_ids = set()

        # Find similar chunks
        try:
            # Fetch more chunks than limit_per_type to allow for filtering by score and parent note uniqueness
            raw_similar_chunks = NoteChunk.find_similar_chunks(
                chunk_text=text,
                limit=limit_per_type * 3, # Fetch more to filter effectively
                exclude_note_id=exclude_note_id
            )
            
            chunks_count = 0
            for chunk_data in raw_similar_chunks:
                note_id = chunk_data.get('note_id')
                distance = float(chunk_data.get('distance'))
                sim_score = self._calculate_similarity_score(distance)

                if sim_score >= 0.65 and note_id not in added_note_ids:
                    try:
                        parent_note = LocalMessage.objects.get(id=note_id)
                        all_results.append({
                            'id': note_id,
                            'text': chunk_data.get('chunk_text'), # Chunk text
                            'similarity_score': sim_score,
                            'distance': distance,
                            'is_full_note': False,
                            'chunk_index': chunk_data.get('chunk_index'),
                            'created_at': parent_note.created_at,
                            'updated_at': parent_note.updated_at
                        })
                        added_note_ids.add(note_id)
                        chunks_count += 1
                        if chunks_count >= limit_per_type:
                            break 
                    except LocalMessage.DoesNotExist:
                        continue
        except Exception as e:
            logger.error(f"Error finding similar chunks for text '{text[:50]}...': {str(e)}")

        # Find similar notes (full documents)
        try:
            text_embedding = NoteEmbedding.get_embedding(text)
            if text_embedding: # Proceed if embedding was successful
                similar_notes_data = NoteEmbedding.find_similar_notes_by_embedding(
                    text_embedding,
                    limit=limit_per_type, 
                    exclude_note_id=exclude_note_id
                )

                notes_count = 0
                for note_data in similar_notes_data:
                    note_id = note_data['note_id']
                    distance = float(note_data['distance'])
                    sim_score = self._calculate_similarity_score(distance)

                    if sim_score >= 0.65 and note_id not in added_note_ids:
                        try:
                            similar_note = LocalMessage.objects.get(id=note_id)
                            all_results.append({
                                'id': similar_note.id,
                                'text': similar_note.text, # Full note text
                                'similarity_score': sim_score,
                                'distance': distance,
                                'is_full_note': True,
                                'created_at': similar_note.created_at,
                                'updated_at': similar_note.updated_at
                            })
                            added_note_ids.add(note_id)
                            notes_count += 1
                            if notes_count >= limit_per_type:
                                break
                        except LocalMessage.DoesNotExist:
                            continue
            else:
                logger.info(f"Could not get embedding for text '{text[:50]}...', skipping note-level similarity search.")
        except Exception as e:
            logger.error(f"Error finding similar notes for text '{text[:50]}...': {str(e)}")
            
        return all_results