from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import serializers
from .models import LocalMessage, LocalMessageList


class SingleNoteView(APIView):
    serializer_class = serializers.MessageSerializer
    permission_classes = [IsAuthenticated]
    def get(self,request,**kwargs):
        serialized = self.serializer_class(data=LocalMessage.objects.get(pk=self.kwargs['note_id']))
        return Response(serialized.data, status.HTTP_200_OK)

    def delete(self, request, **kwargs):
        print(f"deleting {kwargs['note_id']}")
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.delete()
        return Response("1", status=status.HTTP_200_OK)

    def put(self, request, **kwargs):
        print(f"editing {kwargs['note_id']}")
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.text = request.POST.get("text",item.text)
        item.save()
        return Response("1", status=status.HTTP_200_OK)


class MoveMessageView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.MoveMessageSerializer
    def post(self, request, **kwargs):
        message: LocalMessage = LocalMessage.objects.get(pk=self.kwargs['note_id'])
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            print(f"serializer.data is {serializer.data}")
            message.list = LocalMessageList.objects.get(pk=serializer.data['list_id'])
            message.save()
        return Response("1", status=status.HTTP_200_OK)


class NoteView(GenericAPIView, ListModelMixin):
    permission_classes = [IsAuthenticated]
    pagination_class = LimitOffsetPagination
    serializer_class = serializers.MessageSerializer

    def get_queryset(self):
        if 'slug' in self.kwargs:
            slug = self.kwargs['slug']
            print(f"slug is {slug}")
            if slug == "All":
                return LocalMessage.objects.all().order_by('-pinned', 'archived', '-created_at')
            else:
                lst = LocalMessageList.objects.get(slug=slug)
                return LocalMessage.objects.filter(list=lst.id).order_by('-pinned', 'archived', '-created_at')

        else:
            return LocalMessage.objects.none()

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset)

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
            serializer.save(list=lst)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NoteListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.NoteListSerializer

    def get(self, request, format=None):
        local_messages = [msg for msg in LocalMessageList.objects.all()]
        serializer = self.serializer_class(local_messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class DeleteMessageView(APIView):


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