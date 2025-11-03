from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from .pagination import DateBasedPagination
from ..models import LocalMessage, LocalMessageList, Link, NoteRevision, NoteChunk, NoteEmbedding
from ..serializers import MessageSerializer, MoveMessageSerializer, NoteRevisionSerializer, NoteChunkSerializer
import re 
from django.utils import timezone
from typing import Optional
import concurrent.futures
import logging

from ..file_utils import FileManager

# Set up logging
logger = logging.getLogger(__name__)

# Thread pool executor for async tasks
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# Function to create embeddings asynchronously
def create_embeddings_async(note_id, note_text=None):
    try:
        note = LocalMessage.objects.get(pk=note_id)
        if note_text is None:
            note_text = note.text
            
        # Create chunks
        chunks = note.update_chunks() if note_text else note.split_into_chunks()
        
        # Create embedding for the note if it's not RTL
        if not NoteEmbedding.hasRTL(note_text):
            NoteEmbedding.create_for_note(note)
            
        # Create embeddings for chunks if there's more than one chunk
        if len(chunks) > 1:
            for chunk in chunks:
                if not NoteEmbedding.hasRTL(chunk.chunk_text):
                    chunk.create_embedding()
                    
        logger.info(f"Successfully created embeddings for note {note_id}")
    except Exception as e:
        logger.error(f"Error creating embeddings for note {note_id}: {str(e)}", exc_info=True)

class RevisionService:
    MIN_TIME_BETWEEN_REVISIONS = 900  # minimum seconds between revisions
    MAX_REVISIONS = 20  # maximum number of revisions to keep

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
    def get_revision_count(cls, note_id: int) -> int:
        return NoteRevision.objects.filter(note_id=note_id).count()

    @classmethod
    def manage_revision_limit(cls, note_id: int) -> None:
        """
        Manages the revision limit by removing the second oldest revision when the limit is reached
        and updating the diff of the third revision to be relative to the first revision.
        """
        while cls.get_revision_count(note_id) > cls.MAX_REVISIONS:
            # Get all revisions ordered from oldest to newest
            revisions = list(NoteRevision.objects.filter(
                note_id=note_id
            ).order_by('created_at'))
            
            # The first revision stays (index 0)
            # We'll delete the second revision (index 1)
            second_revision = revisions[1]
            third_revision = revisions[2]

            print(f"total number of revisions is {len(revisions) } Deleting revision {second_revision.id}")
            
            # Update the third revision's previous_revision to point to the first revision
            third_revision.previous_revision = revisions[0]
            
            # Recalculate the diff for the third revision against the first revision
            third_revision.diff_text = NoteRevision.create_diff(
                revisions[0].revision_text,
                third_revision.revision_text
            )
            
            # Save the updated third revision
            third_revision.save()
            
            # Delete the second revision
            second_revision.delete()

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
            
            # Check and manage revision limit after creating new revision
            cls.manage_revision_limit(note_id)
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
        
        # Update chunks and schedule async creation of embeddings
        executor.submit(create_embeddings_async, item.id, new_text)
        
        return Response("1", status=status.HTTP_200_OK)

    def delete(self, request, **kwargs):
        try:
            item = LocalMessage.objects.get(pk=kwargs['note_id'])
            
            # Initialize file manager and clean up unused files
            file_manager = FileManager()
            deleted_files = file_manager.delete_unused_files(item.text, item.id)
            print(f"deleted files are {deleted_files}")
            # Delete the note
            item.delete()
            
            # Return success response with info about deleted files
            return Response({
                "message": "Note deleted successfully",
                "deleted_files": deleted_files
            }, status=status.HTTP_200_OK)
            
        except LocalMessage.DoesNotExist:
            return Response({
                "error": "Note not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        if item.importance < 4:
            item.importance += 1
        item.save()
        return Response("1", status=status.HTTP_200_OK)

class UnPinMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        if item.importance > 0:
            item.importance -= 1
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
        base_queryset = LocalMessage.objects.order_by('-importance', '-created_at')
        
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
            
            # Schedule async creation of chunks and embeddings
            executor.submit(create_embeddings_async, note.id, note.text)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Log the error properly
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


class NoteChunksView(APIView):
    """View to retrieve chunks for a note"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, note_id, format=None):
        """
        Get all chunks for a specific note
        """
        # Check if the note exists and user has access to it
        try:
            note = LocalMessage.objects.get(id=note_id)
            # You might want to add additional access checks here
            
            # Get all chunks for this note
            chunks = NoteChunk.objects.filter(note_id=note_id).order_by('chunk_index')
            
            # If no chunks exist yet, create them
            if not chunks.exists():
                note.update_chunks()
                chunks = NoteChunk.objects.filter(note_id=note_id).order_by('chunk_index')
            
            serializer = NoteChunkSerializer(chunks, many=True)
            return Response(serializer.data)
            
        except LocalMessage.DoesNotExist:
            return Response(
                {"error": "Note not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error retrieving note chunks: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve note chunks"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )