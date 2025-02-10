from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from .pagination import DateBasedPagination
from ..models import LocalMessage, LocalMessageList, Link, NoteRevision, NoteEmbedding
from ..serializers import MessageSerializer, MoveMessageSerializer, NoteRevisionSerializer, SimilarNoteSerializer
import re 
from django.utils import timezone
from typing import Optional




class RevisionService:
    MIN_TIME_BETWEEN_REVISIONS = 900  # minimum seconds between revisions

    @classmethod
    def get_latest_revision(cls, note_id: int) -> Optional[NoteRevision]:
        return NoteRevision.objects.filter(
            note_id=note_id
        ).order_by('-created_at').first()

    @classmethod
    def get_second_latest_revision(cls, note_id: int) -> Optional[NoteRevision]:
        return NoteRevision.objects.filter(
            note_id=note_id
        ).order_by('-created_at')[1:2].first()

    @classmethod
    def _has_changes(cls, note_id: int, new_text: str) -> bool:
        """Check if there are actual changes compared to the latest revision"""
        latest_revision = cls.get_latest_revision(note_id)
        if not latest_revision:
            return bool(new_text.strip())  # True if new_text is not empty
        return latest_revision.revision_text != new_text

    @classmethod
    def _should_create_revision(cls, note_id: int, new_text: str) -> bool:

        latest_revision = cls.get_latest_revision(note_id)
        if not latest_revision:
            return True
    
        # First check if there are any actual changes
        if not cls._has_changes(note_id, new_text):
            return False
            
        time_since_last = timezone.now() - latest_revision.created_at
        return time_since_last.total_seconds() >= cls.MIN_TIME_BETWEEN_REVISIONS

    @classmethod
    def update_or_create_revision(cls, note_id: int, new_text: str) -> None:
        """Update existing revision or create new one based on time threshold and content changes"""
        # Don't create or update revision if there are no changes
        if not cls._has_changes(note_id, new_text):
            return

        if cls._should_create_revision(note_id, new_text):
            # Create new revision
            latest_revision = cls.get_latest_revision(note_id)
            base_text = latest_revision.revision_text if latest_revision else ""
            NoteRevision.objects.create(
                note_id=note_id,
                revision_text=new_text,
                previous_revision=latest_revision,
                diff_text=NoteRevision.create_diff(base_text, new_text)
            )
        else:
            # Update latest revision
            latest = cls.get_latest_revision(note_id)
            second_latest = cls.get_second_latest_revision(note_id)
            if second_latest:
                # Update diff against second latest revision
                latest.diff_text = NoteRevision.create_diff(second_latest.revision_text, new_text)
            else:
                # If no second latest, diff against empty string
                latest.diff_text = NoteRevision.create_diff("", new_text)
            latest.revision_text = new_text
            # Update timestamp
            latest.created_at = timezone.now()
            latest.save()

    @classmethod
    def update_note_with_revision(cls, note: LocalMessage, new_text: str) -> None:
        """Update note text and handle revision"""
        # Only update if there are actual changes
        if cls._has_changes(note.id, new_text):
            cls.update_or_create_revision(note.id, new_text)
            note.text = new_text
            note.save()

class SingleNoteView(APIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        serialized = self.serializer_class(
            LocalMessage.objects.prefetch_related("source_links").get(pk=self.kwargs['note_id'])
        )
        return Response(serialized.data, status.HTTP_200_OK)

    def put(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        new_text = request.data.get("text")
        RevisionService.update_note_with_revision(item, new_text)
        insert_links(item)
        return Response("1", status=status.HTTP_200_OK)

    def delete(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.delete()
        return Response("1", status=status.HTTP_200_OK)

class NoteRevisionView(APIView):
    """View for retrieving note revision history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, note_id):
        """Get revision history for a note"""
        revisions = NoteRevision.objects.filter(note_id=note_id).order_by('-created_at')
        if not revisions:
            return Response([], status=status.HTTP_200_OK)
        serializer = NoteRevisionSerializer(revisions, many=True)
        return Response(serializer.data)
    

class MoveMessageView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MoveMessageSerializer

    def post(self, request, **kwargs):
        message = LocalMessage.objects.get(pk=self.kwargs['note_id'])
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            message.list = LocalMessageList.objects.get(pk=serializer.data['list_id'])
            message.save()
        return Response("1", status=status.HTTP_200_OK)

class ArchiveMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.archived = True
        item.save()
        return Response("1", status=status.HTTP_200_OK)

class UnArchiveMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.archived = False
        item.save()
        return Response("1", status=status.HTTP_200_OK)

class PinMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.pinned = True
        item.save()
        return Response("1", status=status.HTTP_200_OK)

class UnPinMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.pinned = False
        item.save()
        return Response("1", status=status.HTTP_200_OK)
    
def insert_links(note: LocalMessage):
    """ extract links from text and insert them as links """
    print(f"inserting links for {note}")
    # delete all links for this note
    Link.objects.filter(source_message=note).delete()
    
    # find all markdown links with regex
    links = re.findall(r'\[.*?\]\((/message/\d+/?)\)', note.text)
    print(f"links are {links}")
    for link in links:
        print(f"link is {link}")
        link_id = re.findall(r'\d+', link)[0]
        print(f"link_id is {link_id}")
        dest_note = LocalMessage.objects.filter(id=link_id).first()
        if dest_note:
            print(f"dest_note is {dest_note}")
            Link.objects.create(source_message=note, dest_message=dest_note)

from django.shortcuts import get_object_or_404

class NoteView(GenericAPIView, ListModelMixin):
    permission_classes = [IsAuthenticated]
    pagination_class = DateBasedPagination
    serializer_class = MessageSerializer

    def get_list(self, slug):
        """Get list by slug or return default list"""
        if not slug:
            return get_object_or_404(LocalMessageList, id=1)
        return get_object_or_404(LocalMessageList, slug=slug)

    def get_queryset(self):
        """Get filtered queryset based on slug parameter"""
        slug = self.kwargs.get('slug')
        
        # Base queryset with ordering
        base_queryset = LocalMessage.objects.order_by('-pinned', '-created_at')
        
        if not slug:
            return LocalMessage.objects.none()
            
        # Handle "All" slug special case
        if slug == "All":
            shown_lin = LocalMessageList.objects.filter(show_in_feed=True).values_list('id', flat=True)
            return base_queryset.filter(list__in=shown_lin)
            
        # Get notes for specific list
        lst = self.get_list(slug)
        return base_queryset.filter(list=lst.id)

    def get(self, request, **kwargs):
        """List notes with pagination"""
        return self.list(request)

    def post(self, request, **kwargs):
        """Create a new note with initial revision"""
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Get appropriate list
            lst = self.get_list(kwargs.get('slug'))
            
            # Save the note
            note = serializer.save(list=lst)
            
            # Create initial revision using RevisionService
            RevisionService.update_or_create_revision(note.id, note.text)
            
            # Handle links
            insert_links(note)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Log the error properly
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating note: {str(e)}", exc_info=True)
            
            return Response(
                {"error": "Failed to create note"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class NoteRevisionView(APIView):
    """View for retrieving note revision history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, note_id):
        """Get revision history for a note"""
        revisions = NoteRevision.objects.filter(note_id=note_id).order_by('-created_at')
        if not revisions:
            return Response([], status=status.HTTP_200_OK)
        serializer = NoteRevisionSerializer(revisions, many=True)
        return Response(serializer.data)


class SimilarNotesView(APIView):
    def get(self, request, note_id):
        note = get_object_or_404(LocalMessage, id=note_id)
        
        # Ensure embedding exists for this note
        embedding, created = NoteEmbedding.objects.get_or_create(note=note)
        
        # Get similar notes
        similar_notes = NoteEmbedding.find_similar_notes(note_id, limit=3)
        
        # Fetch the actual notes with their similarity scores
        notes_with_scores = []
        for result in similar_notes:
            try:
                note = LocalMessage.objects.get(id=result['note_id'])
                notes_with_scores.append({
                    'id': note.id,
                    'text': note.text,
                    'similarity_score': result['distance']
                })
            except LocalMessage.DoesNotExist:
                continue
        
        serializer = SimilarNoteSerializer(notes_with_scores, many=True)
        return Response(serializer.data)