from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import LocalMessage, NoteEmbedding, Link # Added Link
from ..serializers import SimilarNoteSerializer
import logging
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger("note")

class SimilarNotesView(APIView):
    """View for finding similar notes based on note ID or text input"""
    
    def get(self, request, note_id):
        """Find similar notes for a given note ID"""
        note = get_object_or_404(LocalMessage, id=note_id)
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 4))
        workspace_slug = request.query_params.get('workspace')
        
        # Determine which workspace to filter by
        workspace_category_ids = set()
        if workspace_slug:
            from ..models import Workspace
            try:
                workspace = Workspace.objects.get(slug=workspace_slug, user=request.user)
                workspace_category_ids.update(workspace.categories.values_list('id', flat=True))
            except Workspace.DoesNotExist:
                pass
        
        # If no workspace specified or workspace not found, use all categories from all workspaces
        if not workspace_category_ids:
            workspaces = note.list.workspaces.all()
            for ws in workspaces:
                workspace_category_ids.update(ws.categories.values_list('id', flat=True))
        
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

            # Get IDs of linked notes (both directions)
            backlink_ids = set(Link.objects.filter(dest_message_id=note_id).values_list('source_message_id', flat=True))
            forward_link_ids = set(Link.objects.filter(source_message_id=note_id).values_list('dest_message_id', flat=True))
            linked_note_ids = backlink_ids | forward_link_ids

            # Fetch more items to account for filtering out linked notes and workspace categories
            effective_limit = (limit + len(linked_note_ids)) * 2 

            # Get similar notes based on embeddings
            similar_notes_results = NoteEmbedding.find_similar_notes(note_id, limit=effective_limit)
            
            # Process and format results
            for result in similar_notes_results:
                try:
                    similar_note_id = result['note_id']
                    # Exclude if the similar note is the note itself or if it's linked (either direction)
                    if similar_note_id == note.id or similar_note_id in linked_note_ids:
                        continue

                    similar_note = LocalMessage.objects.get(id=similar_note_id)
                    # Only include notes from categories in the same workspaces
                    if similar_note.list_id not in workspace_category_ids:
                        continue
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
                            'updated_at': similar_note.updated_at,
                            'category': {
                                'id': similar_note.list.id,
                                'name': similar_note.list.name,
                                'slug': similar_note.list.slug
                            }
                        })
                except LocalMessage.DoesNotExist:
                    continue
            
            # Sort by distance (lower score is better)
            results.sort(key=lambda x: x['distance'])
            
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
        text = request.data.get('text')
        if not text or len(text) < 10:
            return Response(
                {'error': 'Please provide text with at least 10 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.data.get('limit', 3))
        exclude_note_id = request.data.get('exclude_note_id')
        list_slugs = request.data.get('list_slug', '')
        has_files = request.data.get('has_files', False)
        
        if not list_slugs:
            referer = request.META.get('HTTP_REFERER')
            if referer:
                parsed_url = urlparse(referer)
                query_params = parse_qs(parsed_url.query)
                if 'list_slug' in query_params and query_params['list_slug']:
                    list_slugs = query_params['list_slug'][0]
        
        if exclude_note_id:
            exclude_note_id = int(exclude_note_id)
        
        try:
            all_found_items = self._find_similars_by_text(
                text=text,
                limit_per_type=limit,
                exclude_note_id=exclude_note_id,
                list_slugs=list_slugs,
                user=request.user
            )
            
            if has_files:
                all_found_items = [item for item in all_found_items if LocalMessage.objects.filter(id=item['id'], files__isnull=False).exists()]
            
            all_found_items.sort(key=lambda x: x['distance'])
            results = all_found_items[:limit]
            
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
    
    def _get_allowed_category_ids(self, list_slugs, user):
        from ..models import LocalMessageList
        
        if not list_slugs:
            return None
        
        slug_list = [slug.strip() for slug in list_slugs.split(',')]
        lists = LocalMessageList.objects.filter(slug__in=slug_list, user=user)
        allowed_ids = set(lists.values_list('id', flat=True))
        
        return allowed_ids if allowed_ids else None
    
    def _find_similars_by_text(self, text, limit_per_type, exclude_note_id=None, list_slugs='', user=None):
        allowed_category_ids = self._get_allowed_category_ids(list_slugs, user)
        
        all_results = []
        added_note_ids = set()

        try:
            text_embedding = NoteEmbedding.get_embedding(text)
            if text_embedding:
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
                            if allowed_category_ids is not None and similar_note.list_id not in allowed_category_ids:
                                continue
                            all_results.append({
                                'id': similar_note.id,
                                'text': similar_note.text,
                                'similarity_score': sim_score,
                                'distance': distance,
                                'is_full_note': True,
                                'created_at': similar_note.created_at,
                                'updated_at': similar_note.updated_at,
                                'category': {
                                    'id': similar_note.list.id,
                                    'name': similar_note.list.name,
                                    'slug': similar_note.list.slug
                                }
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