from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from itertools import chain
from operator import attrgetter

from ..models import FileCollection, LocalMessage, File, LocalMessageList, Workspace
from ..serializers import FileCollectionSerializer, MessageSerializer


class FileCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collection_id=None):
        if collection_id:
            collection = get_object_or_404(FileCollection, id=collection_id, user=request.user)
            serializer = FileCollectionSerializer(collection)
            return Response(serializer.data)
        
        collections = FileCollection.objects.filter(user=request.user)
        
        archived = request.query_params.get('archived', 'false').lower() == 'true'
        if not archived:
            collections = collections.filter(archived=False)
        
        serializer = FileCollectionSerializer(collections, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data['user'] = request.user.id
        
        serializer = FileCollectionSerializer(data=data)
        if serializer.is_valid():
            collection = serializer.save(user=request.user)
            return Response(FileCollectionSerializer(collection).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, collection_id):
        collection = get_object_or_404(FileCollection, id=collection_id, user=request.user)
        
        serializer = FileCollectionSerializer(collection, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, collection_id):
        collection = get_object_or_404(FileCollection, id=collection_id, user=request.user)
        collection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionFilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, collection_id):
        collection = get_object_or_404(FileCollection, id=collection_id, user=request.user)
        from ..serializers import FileSerializer
        files = collection.files.all()
        serializer = FileSerializer(files, many=True)
        return Response(serializer.data)

    def post(self, request, collection_id):
        collection = get_object_or_404(FileCollection, id=collection_id, user=request.user)
        
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Request data: {request.data}")
        logger.error(f"Content-Type: {request.content_type}")
        logger.error(f"Request META: {request.META.get('CONTENT_LENGTH')}")
        
        try:
            import json
            body = request.body.decode('utf-8') if hasattr(request, '_body') else 'no body'
            logger.error(f"Raw body: {body}")
        except:
            logger.error("Could not read body")
        
        file_id = request.data.get('file_id')
        
        if not file_id:
            return Response({
                'error': 'file_id is required',
                'received_data': str(request.data),
                'content_type': request.content_type
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj = get_object_or_404(File, id=file_id, user=request.user)
        collection.files.add(file_obj)
        
        return Response({'message': 'File added to collection'}, status=status.HTTP_200_OK)

    def delete(self, request, collection_id):
        collection = get_object_or_404(FileCollection, id=collection_id, user=request.user)
        file_id = request.data.get('file_id')
        
        if not file_id:
            return Response({'error': 'file_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj = get_object_or_404(File, id=file_id)
        collection.files.remove(file_obj)
        
        return Response({'message': 'File removed from collection'}, status=status.HTTP_200_OK)


class UnifiedFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug=None):
        user = request.user
        page = int(request.query_params.get('page', 1))
        page_size = 20
        archived = request.query_params.get('archived', 'false').lower() == 'true'
        workspace_slug = request.query_params.get('workspace')
        
        notes_query = LocalMessage.objects.filter(user=user)
        collections_query = FileCollection.objects.filter(user=user)
        
        if workspace_slug:
            try:
                workspace = Workspace.objects.get(slug=workspace_slug, user=user)
                category_ids = workspace.get_visible_categories().values_list('id', flat=True)
                notes_query = notes_query.filter(list_id__in=category_ids)
                collections_query = collections_query.filter(list_id__in=category_ids)
            except Workspace.DoesNotExist:
                pass
        
        if slug:
            try:
                category = LocalMessageList.objects.get(slug=slug, user=user)
                notes_query = notes_query.filter(list=category)
                collections_query = collections_query.filter(list=category)
            except LocalMessageList.DoesNotExist:
                return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not archived:
            notes_query = notes_query.filter(archived=False)
            collections_query = collections_query.filter(archived=False)
        
        notes = list(notes_query)
        collections = list(collections_query)
        
        combined = sorted(
            chain(notes, collections),
            key=attrgetter('created_at'),
            reverse=True
        )
        
        start = (page - 1) * page_size
        end = start + page_size
        paginated_items = combined[start:end]
        
        result = []
        for item in paginated_items:
            if isinstance(item, LocalMessage):
                serializer = MessageSerializer(item)
                data = serializer.data
                data['type'] = 'note'
                result.append(data)
            elif isinstance(item, FileCollection):
                serializer = FileCollectionSerializer(item)
                result.append(serializer.data)
        
        return Response({
            'results': result,
            'count': len(combined),
            'page': page,
            'page_size': page_size
        })
