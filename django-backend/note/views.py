from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from rest_framework.pagination import  PageNumberPagination
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from PIL import Image

from . import serializers
from .models import LocalMessage, LocalMessageList, Link


import json
import re

from minio import Minio
from minio.error import S3Error
from django.conf import settings
import io

minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_USE_SSL
)

# Ensure the bucket exists
def ensure_bucket_exists(bucket_name):
    try:
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
    except S3Error as e:
        print(f"Error creating bucket: {e}")

# Use this function at the start of your Django app
ensure_bucket_exists(settings.MINIO_BUCKET_NAME)

class SingleNoteView(APIView):
    serializer_class = serializers.MessageSerializer
    permission_classes = [IsAuthenticated]
    def get(self,request,**kwargs):
        serialized = self.serializer_class(LocalMessage.objects.prefetch_related("source_links").get(pk=self.kwargs['note_id']))
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
        insert_links(item);
        return Response("1", status=status.HTTP_200_OK)


class MoveMessageView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.MoveMessageSerializer
    def post(self, request, **kwargs):
        message: LocalMessage = LocalMessage.objects.get(pk=self.kwargs['note_id'])
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
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
    
    
def insert_links(note: LocalMessage):
    """ extract links from text and insert them as links """
    print(f"inserting links for {note}")
    # delete all links for this note
    Link.objects.filter(source_message=note).delete()
    
    # find all markdown links with regex
    links = re.findall(r'\[\]\(/message/\d+\/?\)', note.text)
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


    def post(self, request, **kwargs):
        serializer = self.serializer_class(data=request.data)
        lst = None
        if 'slug' in kwargs:
            lst = LocalMessageList.objects.get(slug=self.kwargs['slug'])
        else:
            lst = LocalMessageList.objects.get(id=1)

        if serializer.is_valid():
            
            resp = serializer.save(list=lst)

            insert_links(resp);

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from django.http import HttpResponse, Http404



import traceback
def serve_minio_file(request, file_path):

    
    # remove last slash
    file_path = file_path.replace("note/","")
    file_path = file_path[:-1] if file_path.endswith("/") else file_path
    print(f"file_path is {file_path}")
    try:
        # Get the file data from MinIO
        data = minio_client.get_object(bucket_name=settings.MINIO_BUCKET_NAME, object_name=file_path)

        
        # Determine the content type (you might want to store this in your database)
        content_type = 'application/octet-stream'  # default
        if file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            content_type = f'image/{file_path.split(".")[-1].lower()}'
        
        # Create the response
        response = HttpResponse(data.read(), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{file_path.split("/")[-1]}"'
        return response
    except Exception as e:
        # print stack trace
        
        traceback.print_exc()
        raise Http404("File not found")
    

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def save_to_minio(self, file, object_name):
        try:
            file_data = file.read()
            file_size = len(file_data)
            file_data = io.BytesIO(file_data)
            
            minio_client.put_object(
                settings.MINIO_BUCKET_NAME,
                object_name,
                file_data,
                file_size,
                content_type=file.content_type
            )
            return f"{settings.MINIO_BUCKET_NAME}/{object_name}"
        except S3Error as e:
            print(f"Error saving to MinIO: {e}")
            return None

    def compress_image(self, image, max_size=(800, 600), quality=95):
        img = Image.open(image)
        
        # Convert RGBA to RGB if necessary
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        # Calculate new size while maintaining aspect ratio
        img.thumbnail(max_size, Image.ANTIALIAS)
        
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG', quality=quality, optimize=True)
        img_io.seek(0)
        return img_io

    def save_to_minio(self, file_data, object_name, content_type):
        try:
            file_size = file_data.getbuffer().nbytes
            minio_client.put_object(
                settings.MINIO_BUCKET_NAME,
                object_name,
                file_data,
                file_size,
                content_type=content_type
            )
            return f"{settings.MINIO_BUCKET_NAME}/{object_name}"
        except S3Error as e:
            print(f"Error saving to MinIO: {e}")
            return None

    def post(self, request, format=None):
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        compress_image = request.POST.get('compress_image', 'false').lower() == 'true'

        if compress_image and file.content_type.startswith('image'):
            compressed_file = self.compress_image(file)
            object_name = f"uploads/compressed_{file.name.rsplit('.', 1)[0]}.jpg"
            file_to_save = compressed_file
            content_type = 'image/jpeg'
        else:
            object_name = f"uploads/{file.name}"
            file_to_save = file
            content_type = file.content_type

        # Read the file content into a BytesIO object
        if isinstance(file_to_save, io.BytesIO):
            file_data = file_to_save
        else:
            file_data = io.BytesIO(file_to_save.read())

        url = "/api/note/files/" + self.save_to_minio(file_data, object_name, content_type)

        if url:
            return Response({'url': url}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to upload file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
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
        parameters=[serializers.SearchSerializer]
    )
    def get(self, request, **kwargs):
        # return Response(self.serializer_class(self.get_queryset(),many=True),status=status.HTTP_200_OK)
        return  self.list(request)