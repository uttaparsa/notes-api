from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings

from ..models import LocalMessage, NoteChunk, NoteEmbedding
from ..serializers import SimilarNoteSerializer, SimilarChunkSerializer, SimilarNotesResponseSerializer

class SimilarChunksView(APIView):
    """View for finding similar chunks to a given text"""
    
    def post(self, request):
        """Find chunks similar to the provided text"""
        # Get the text from the request
        chunk_text = request.data.get('text')
        if not chunk_text:
            return Response(
                {'error': 'No text provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional parameters
        limit = int(request.data.get('limit', 10))
        exclude_note_id = request.data.get('exclude_note_id')
        if exclude_note_id:
            exclude_note_id = int(exclude_note_id)
        
        # Find similar chunks
        similar_chunks = NoteChunk.find_similar_chunks(
            chunk_text=chunk_text,
            limit=limit,
            exclude_note_id=exclude_note_id
        )
        
        # Serialize the results
        serializer = SimilarChunkSerializer(similar_chunks, many=True)
        return Response(serializer.data)


class NoteChunkSimilarityView(APIView):
    """View for finding chunks similar to each chunk in a note"""
    
    def get(self, request, note_id):
        """Find chunks similar to each chunk in the given note"""
        # Verify the note exists
        try:
            note = LocalMessage.objects.get(id=note_id)
        except LocalMessage.DoesNotExist:
            return Response(
                {'error': 'Note not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get optional parameter
        limit = int(request.query_params.get('limit', 5))
        
        # Find similar chunks for each chunk in the note
        similar_chunks = NoteChunk.find_similar_chunks_for_note(
            note_id=note_id,
            limit=limit
        )
        
        # Serialize the results
        serializer = SimilarNotesResponseSerializer(similar_chunks, many=True)
        return Response(serializer.data)


class GenerateChunksView(APIView):
    """View for generating chunks for a note"""
    
    def post(self, request, note_id):
        """Generate or regenerate chunks for a note"""
        # Verify the note exists
        try:
            note = LocalMessage.objects.get(id=note_id)
        except LocalMessage.DoesNotExist:
            return Response(
                {'error': 'Note not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate chunks
        chunks = note.update_chunks()
        
        # Generate embeddings for each chunk
        for chunk in chunks:
            chunk.create_embedding()
        
        # Return the generated chunks
        return Response({
            'success': True,
            'note_id': note_id,
            'chunk_count': len(chunks)
        })


class SimilarNotesView(APIView):
    """View for finding similar notes"""
    
    def get(self, request, note_id):
        note = get_object_or_404(LocalMessage, id=note_id)
        
        # Ensure embedding exists for this note
        embedding, created = NoteEmbedding.objects.get_or_create(note_id=note.id)
        
        if not settings.DEBUG:
            # Get similar notes
            similar_notes = NoteEmbedding.find_similar_notes(note_id, limit=5)
            
            # Fetch the actual notes with their similarity scores
            notes_with_scores = []
            for result in similar_notes:
                try:
                    similar_note = LocalMessage.objects.get(id=result['note_id'])
                    # Calculate similarity score
                    similarity_score = result['distance']
                    
                    # Only include notes with high enough similarity
                    max_distance = 4.0
                    normalized_score = max(0, 1 - (float(similarity_score) / max_distance))
                    if normalized_score >= 0.78:
                        notes_with_scores.append({
                            'id': similar_note.id,
                            'text': similar_note.text,
                            'similarity_score': similarity_score
                        })
                except LocalMessage.DoesNotExist:
                    continue
                    
            # Serialize the results
            serializer = SimilarNoteSerializer(notes_with_scores, many=True)
            return Response(serializer.data)
        
        # Return empty list in debug mode
        return Response([])