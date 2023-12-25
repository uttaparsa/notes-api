from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from rest_framework.pagination import  PageNumberPagination
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import serializers
from .models import LocalMessage, LocalMessageList


import json


class SingleNoteView(APIView):
    serializer_class = serializers.MessageSerializer
    permission_classes = [IsAuthenticated]
    def get(self,request,**kwargs):
        serialized = self.serializer_class(LocalMessage.objects.get(pk=self.kwargs['note_id']))
        return Response(serialized.data, status.HTTP_200_OK)

    def delete(self, request, **kwargs):
        print(f"deleting {kwargs['note_id']}")
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.delete()
        return Response("1", status=status.HTTP_200_OK)

    def put(self, request, **kwargs):
        print(f"editing {kwargs['note_id']}")
        item = LocalMessage.objects.get(pk=kwargs['note_id'])
        item.text = request.data.get("text")
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


from datetime import date


class DateBasedPagination(PageNumberPagination):
    page_size = 20  # Adjust as per your requirements

    def get_page_number(self, request, paginator):
        # Retrieve the requested page number based on the date parameter

        if 'date' in request.GET:
            archive_lst = LocalMessageList.objects.filter(slug='archive').first()  # get archive list to ignore it
            archive_lst_id = archive_lst.id if archive_lst else -1
            selected_date = date(*map(int, request.GET.get("date").split('-')))
            print(f"selected date is {selected_date}")
            queryset = paginator.object_list.exclude(list=archive_lst_id).order_by('-pinned', '-created_at')\
                .filter(Q(created_at__gt=selected_date) | Q(pinned=True))
            page_number = queryset.count() // self.page_size + 1
            print(f"page_number is {page_number}, page_size = {self.page_size}")

            return page_number

        return super().get_page_number(request, paginator)


class PublicNoteView(GenericAPIView, ListModelMixin):
    permission_classes = [AllowAny]
    pagination_class = DateBasedPagination
    serializer_class = serializers.MessageSerializer

    def get_queryset(self):
        public_lst = LocalMessageList.objects.filter(slug='public').first()
        public_lst_id = public_lst.id if public_lst else -1
        return LocalMessage.objects.filter(list=public_lst_id).order_by('-pinned', '-created_at')
    def get(self, request, **kwargs):
        return self.list(request)

class NoteView(GenericAPIView, ListModelMixin):
    permission_classes = [IsAuthenticated]
    pagination_class = DateBasedPagination
    serializer_class = serializers.MessageSerializer

    def get_queryset(self):
        if 'slug' in self.kwargs:

            slug = self.kwargs['slug']
            print(f"slug is {slug}")
            archive_lst = LocalMessageList.objects.filter(slug='archive').first() # get archive list to ignore it
            archive_lst_id = archive_lst.id if archive_lst else -1
            if slug == "All":
                print(f"self.request.data is {self.request.GET}")
                return LocalMessage.objects.exclude(list=archive_lst_id).order_by('-pinned',  '-created_at')
            else:
                lst = LocalMessageList.objects.get(slug=slug)
                return LocalMessage.objects.filter(list=lst.id).order_by('-pinned',  '-created_at')

        else:
            return LocalMessage.objects.none()

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset)

    def get(self, request, **kwargs):
        return self.list(request)

    def save_image(self, request, local_message: LocalMessage):
        print("saving image")
        local_message.image = request.FILES['file']

        local_message.save()

    def save_file(self, request, local_message: LocalMessage):
        print("saving file")
        local_message.file = request.FILES['file']

        local_message.save()
    def post(self, request, **kwargs):
        meta_data = json.loads(str(request.FILES.get('meta').read().decode('utf-8')))
        serializer = self.serializer_class(data=meta_data)
        lst = None
        if 'slug' in kwargs:
            lst = LocalMessageList.objects.get(slug=self.kwargs['slug'])
        else:
            lst = LocalMessageList.objects.get(id=1)

        if serializer.is_valid():

            resp = serializer.save(list=lst)
            if 'file' in request.FILES.keys():
                file_extension = request.FILES['file'].name.split('.')[-1]
                print(f"file_extension is {file_extension}")
                if file_extension.lower() in ['jpg','png','jpeg']:
                    self.save_image(request, resp)
                else:
                    self.save_file(request, resp)
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

    def put(self,request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class DeleteMessageView(APIView):


class ArchiveMessageListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, **kwargs):
        item = LocalMessageList.objects.get(pk=kwargs['topic_id'])
        item.archived = True
        item.save()
        return Response("1", status=status.HTTP_200_OK)


class UnArchiveMessageListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, **kwargs):
        item = LocalMessageList.objects.get(pk=kwargs['topic_id'])
        item.archived = False
        item.save()
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

class SearchResultsView(GenericAPIView,ListModelMixin):
    permission_classes = [IsAuthenticated]
    pagination_class = DateBasedPagination
    serializer_class = serializers.MessageSerializer


    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset)
    def get_queryset(self):  # new
        print(f"self.request.data is {self.request.GET}")
        query = self.request.GET.get("q","NOOOOOOOO")
        print(f"searching for {query}")

        if 'list_slug' in self.request.GET:
            list_slug = self.request.GET.get("list_slug")
            lst = LocalMessageList.objects.get(slug=list_slug)
            object_list = LocalMessage.objects.filter(
                Q(text__icontains=query) & Q(list=lst.id)
            ).order_by('-created_at')
            print(f"searching in list {list_slug}")
            return object_list

        else:
            return  LocalMessage.objects.filter(
                Q(text__icontains=query)
            ).order_by('-created_at')

        # print("not valid")
        return LocalMessage.objects.none()

    @extend_schema(
        parameters=[serializers.SeachSerializer]
    )
    def get(self, request, **kwargs):
        # return Response(self.serializer_class(self.get_queryset(),many=True),status=status.HTTP_200_OK)
        return  self.list(request)