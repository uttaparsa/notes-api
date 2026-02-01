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

            # Get IDs of notes that link to the current note (backlinks)
            backlink_ids = set(Link.objects.filter(dest_message_id=note_id).values_list('source_message_id', flat=True))

            # Fetch more items to account for filtering out backlinks and workspace categories, ensure we can meet the limit
            # Add buffer for backlinks and workspace filtering
            effective_limit = (limit + len(backlink_ids)) * 2 

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
        """Find similar notes for a given text input"""
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
        list_slugs = request.data.get('list_slug', 'All')
        workspace_slug = request.data.get('workspace')
        has_files = request.data.get('has_files', False)
        
        # If not in data, try to extract from referer
        if list_slugs == 'All' and not workspace_slug:
            referer = request.META.get('HTTP_REFERER')
            if referer:
                parsed_url = urlparse(referer)
                query_params = parse_qs(parsed_url.query)
                if 'list_slug' in query_params and query_params['list_slug']:
                    list_slugs = query_params['list_slug'][0]
                if 'workspace_slug' in query_params and query_params['workspace_slug']:
                    workspace_slug = query_params['workspace_slug'][0]
        
        if exclude_note_id:
            exclude_note_id = int(exclude_note_id)
        
        try:
            all_found_items = self._find_similars_by_text(
                text=text,
                limit_per_type=limit, # This is the desired count for each type
                exclude_note_id=exclude_note_id,
                list_slugs=list_slugs,
                workspace_slug=workspace_slug,
                user=request.user
            )
            
            if has_files:
                all_found_items = [item for item in all_found_items if LocalMessage.objects.filter(id=item['id'], files__isnull=False).exists()]
            
            # Sort by similarity (higher score is better) and limit results
            all_found_items.sort(key=lambda x: x['distance'])
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
    
    def _get_allowed_category_ids(self, list_slugs, workspace_slug, user):
        """Get allowed category IDs based on list_slugs and workspace_slug"""
        from ..models import LocalMessageList, Workspace
        
        if list_slugs.lower() == 'all' and not workspace_slug:
            # No filtering needed
            return None
        
        allowed_ids = set()
        
        # Get workspace if specified
        workspace = None
        if workspace_slug:
            try:
                workspace = Workspace.objects.get(slug=workspace_slug, user=user)
            except Workspace.DoesNotExist:
                return set()  # No allowed categories
        
        if list_slugs and list_slugs.lower() != 'all':
            slug_list = [slug.strip() for slug in list_slugs.split(',')]
            lists = LocalMessageList.objects.filter(slug__in=slug_list, user=user)
            
            if workspace:
                visible_lists = workspace.get_visible_categories()
                lists = lists.filter(id__in=visible_lists.values_list('id', flat=True))
            
            allowed_ids.update(lists.values_list('id', flat=True))
        elif workspace:
            # If workspace is specified but no specific lists, use all visible categories
            visible_list_ids = workspace.get_visible_categories().values_list('id', flat=True)
            allowed_ids.update(visible_list_ids)
        
        return allowed_ids if allowed_ids else None
    
    def _find_similars_by_text(self, text, limit_per_type, exclude_note_id=None, list_slugs='All', workspace_slug=None, user=None):
        """Helper method to find similar notes for arbitrary text"""
        # Get allowed category IDs based on list_slugs and workspace_slug
        allowed_category_ids = self._get_allowed_category_ids(list_slugs, workspace_slug, user)
        
        all_results = []
        # Keep track of note IDs added to avoid duplicates
        added_note_ids = set()

        # Find similar notes
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
                            # Filter by allowed categories
                            if allowed_category_ids is not None and similar_note.list_id not in allowed_category_ids:
                                continue
                            all_results.append({
                                'id': similar_note.id,
                                'text': similar_note.text, # Full note text
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
            
        # sort all results by distance (lower is better)
        return all_results