from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import LocalMessage, NoteChunk, NoteEmbedding
from ..serializers import SimilarNoteSerializer
import logging

logger = logging.getLogger(__name__)

class SimilarNotesView(APIView):
    """View for finding similar notes based on note ID or text input"""
    
    def get(self, request, note_id):
        """Find similar notes for a given note ID"""
        note = get_object_or_404(LocalMessage, id=note_id)
        
        # Get query parameters
        mode = request.query_params.get('mode', 'all')  # Options: 'notes', 'chunks', 'all'
        limit = int(request.query_params.get('limit', 5))
        
        try:
            results = []
            
            # Find similar notes if mode is 'notes' or 'all'
            if mode in ['notes', 'all']:
                # Ensure embedding exists for this note
                embedding_exists = NoteEmbedding.objects.filter(note_id=note.id).exists()
                
                if not embedding_exists:
                    # Create embedding if it doesn't exist
                    try:
                        NoteEmbedding.create_for_note(note)
                    except Exception as e:
                        logger.error(f"Error creating embedding for note {note_id}: {str(e)}")
                        if mode == 'notes':
                            return Response(
                                {'error': 'Could not create embedding for this note.'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                
                # Get similar notes based on embeddings
                similar_notes_results = NoteEmbedding.find_similar_notes(note_id, limit=limit)
                
                # Process and format results
                for result in similar_notes_results:
                    try:
                        similar_note = LocalMessage.objects.get(id=result['note_id'])
                        distance = float(result['distance'])
                        sim_score = self._calculate_similarity_score(distance)
                        # Only include notes with reasonable similarity
                        if sim_score >= 0.65:
                            results.append({
                                'id': similar_note.id,
                                'text': similar_note.text[:200] + ('...' if len(similar_note.text) > 200 else ''),
                                'similarity_score': sim_score,
                                'distance': distance,
                                'is_full_note': True,
                                'created_at': similar_note.created_at,
                                'updated_at': similar_note.updated_at
                            })
                    except LocalMessage.DoesNotExist:
                        continue
            
            # Find similar chunks if mode is 'chunks' or 'all' and we need more results
            if mode in ['chunks', 'all'] and (mode == 'chunks' or len(results) < limit):
                chunk_results = self._find_similar_chunks_for_note(
                    note_id,
                    limit=limit - len(results) if mode == 'all' else limit
                )
                
                if mode == 'chunks':
                    results = chunk_results
                else:
                    # Add unique chunk results (avoid duplicate notes)
                    note_ids_added = {r['id'] for r in results}
                    for chunk_result in chunk_results:
                        note_id = chunk_result.get('id')
                        if note_id not in note_ids_added:
                            results.append(chunk_result)
                            note_ids_added.add(note_id)
                            
                            # Stop once we have enough results
                            if len(results) >= limit:
                                break
            
            # Sort by similarity score (lower distance is better)
            results.sort(key=lambda x: x['similarity_score'])
            
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
        mode = request.data.get('mode', 'chunks')  # Options: 'notes', 'chunks', 'all'
        
        if exclude_note_id:
            exclude_note_id = int(exclude_note_id)
        
        try:
            results = []
            
            # If mode is 'chunks' or 'all', search for similar chunks
            if mode in ['chunks', 'all']:
                chunk_results = self._find_similar_chunks_by_text(
                    text=text,
                    limit=limit * 2,  # Get more than we need so we can filter
                    exclude_note_id=exclude_note_id
                )
                
                if mode == 'chunks':
                    results = chunk_results
                else:
                    results.extend(chunk_results)
            
            # If mode is 'notes' or 'all', also find similar full notes
            if mode in ['notes', 'all']:
                # This would require implementing a method to find similar notes by text
                # For now, we'll just use our chunk results and add a placeholder for future implementation
                if mode == 'notes' and not results:
                    logger.warning("Finding similar notes by text is not yet implemented")
            
            # Sort by similarity and limit results
            results.sort(key=lambda x: x['similarity_score'])
            results = results[:limit]
            
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
    
    def _find_similar_chunks_for_note(self, note_id, limit=3):
        """Helper method to find similar chunks for a note"""
        # Get chunks from the current note
        note_chunks = NoteChunk.objects.filter(note_id=note_id)
        if not note_chunks.exists():
            # Try to create chunks for this note
            try:
                note = LocalMessage.objects.get(id=note_id)
                note_chunks = note.split_into_chunks()
                
                # Create embeddings for new chunks
                for chunk in note_chunks:
                    chunk.create_embedding()
            except Exception as e:
                logger.error(f"Error creating chunks for note {note_id}: {str(e)}")
                return []
        
        results = []
        note_ids_added = set()
        
        # For each chunk, find similar chunks from other notes
        for chunk in note_chunks:
            chunk_results = NoteChunk.find_similar_chunks(
                chunk_text=chunk.chunk_text,
                limit=2,
                exclude_note_id=note_id
            )
            
            for chunk_result in chunk_results:
                result_note_id = chunk_result.get('note_id')
                distance = float(chunk_result.get('distance'))
                
                # Only add if we have good similarity and haven't added this note yet
                if self._calculate_similarity_score(distance) >= 0.7 and result_note_id not in note_ids_added:
                    try:
                        parent_note = LocalMessage.objects.get(id=result_note_id)
                        
                        results.append({
                            'id': result_note_id,
                            'text': chunk_result.get('chunk_text'),
                            'similarity_score': distance,
                            'is_full_note': False,
                            'chunk_index': chunk_result.get('chunk_index'),
                            'created_at': parent_note.created_at,
                            'updated_at': parent_note.updated_at
                        })
                        
                        note_ids_added.add(result_note_id)
                        
                        # Stop once we have enough results
                        if len(results) >= limit:
                            break
                    except LocalMessage.DoesNotExist:
                        continue
            
            # Stop once we have enough results
            if len(results) >= limit:
                break
        
        return results
    
    def _find_similar_chunks_by_text(self, text, limit=3, exclude_note_id=None):
        """Helper method to find similar chunks for arbitrary text"""
        try:
            # Search for similar chunks
            similar_chunks = NoteChunk.find_similar_chunks(
                chunk_text=text,
                limit=limit * 2,  # Get more than we need so we can filter
                exclude_note_id=exclude_note_id
            )
            
            # Process and format results
            results = []
            note_ids_added = set()
            
            for chunk in similar_chunks:
                note_id = chunk.get('note_id')
                distance = float(chunk.get('distance'))
                
                # Only include chunks with good similarity
                if self._calculate_similarity_score(distance) >= 0.65 and note_id not in note_ids_added:
                    try:
                        # Get the parent note
                        parent_note = LocalMessage.objects.get(id=note_id)
                        
                        results.append({
                            'id': note_id,
                            'text': chunk.get('chunk_text'),
                            'similarity_score': distance,
                            'is_full_note': False,
                            'chunk_index': chunk.get('chunk_index'),
                            'created_at': parent_note.created_at,
                            'updated_at': parent_note.updated_at
                        })
                        
                        note_ids_added.add(note_id)
                        
                        # Stop once we have enough results
                        if len(results) >= limit:
                            break
                    except LocalMessage.DoesNotExist:
                        continue
            
            return results
            
        except Exception as e:
            logger.error(f"Error finding similar chunks for text: {str(e)}")
            return []