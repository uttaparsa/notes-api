from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from .pagination import DateBasedPagination
from ..models import LocalMessage, LocalMessageList, Link
from ..serializers import MessageSerializer, MoveMessageSerializer
import re 

class SingleNoteView(APIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        serialized = self.serializer_class(LocalMessage.objects.prefetch_related("source_links").get(pk=self.kwargs['note_id']))
        return Response(serialized.data, status.HTTP_200_OK)

    def delete(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.delete()
        return Response("1", status=status.HTTP_200_OK)

    def put(self, request, **kwargs):
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.text = request.data.get("text")
        item.save()
        insert_links(item)
        return Response("1", status=status.HTTP_200_OK)

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


class NoteView(GenericAPIView, ListModelMixin):
    permission_classes = [IsAuthenticated]
    pagination_class = DateBasedPagination
    serializer_class = MessageSerializer

    def get_queryset(self):
        if 'slug' in self.kwargs:
            slug = self.kwargs['slug']
            archive_lst = LocalMessageList.objects.filter(slug='archive').first()
            archive_lst_id = archive_lst.id if archive_lst else -1
            if slug == "All":
                return LocalMessage.objects.exclude(list=archive_lst_id).order_by('-pinned', '-created_at')
            else:
                lst = LocalMessageList.objects.get(slug=slug)
                return LocalMessage.objects.filter(list=lst.id).order_by('-pinned', '-created_at')
        else:
            return LocalMessage.objects.none()

    def get(self, request, **kwargs):
        return self.list(request)

    def post(self, request, **kwargs):
        serializer = self.serializer_class(data=request.data)
        lst = None
        if 'slug' in kwargs:
            lst = LocalMessageList.objects.get(slug=self.kwargs['slug'])
        else:
            lst = LocalMessageList.objects.get(id=1)

        if serializer.is_valid():
            resp = serializer.save(list=lst)
            insert_links(resp)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)