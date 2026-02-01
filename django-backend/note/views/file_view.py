from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from PIL import Image
import io
from django.conf import settings
from minio.error import S3Error

from minio import Minio
import traceback
from django.http import HttpResponse, Http404
import random
import string

from ..file_utils import file_access_tracker
from ..models import File, LocalMessage
from django.shortcuts import get_object_or_404
from ..serializers import FileSerializer

minio_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_USE_SSL
)



def ensure_bucket_exists(bucket_name):
    try:
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
    except S3Error as e:
        print(f"Error creating bucket: {e}")

# Use this function at the start of your Django app
ensure_bucket_exists(settings.MINIO_BUCKET_NAME)



from django.http import HttpResponse, Http404
from django.conf import settings
import traceback

# Import your minio client and file access tracker from your module
# from .minio_client import minio_client
# from .file_access_tracker import file_access_tracker

def serve_minio_file(request, file_path):
    file_path = file_path.replace("note/", "")
    file_path = file_path[:-1] if file_path.endswith("/") else file_path
    
    # Get client IP with more robust method
    def get_client_ip(request):
        """Extract the real client IP from various headers"""
        # Check for common proxy headers first
        for header in [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
        ]:
            value = request.META.get(header)
            if value:
                # Take the first IP in case of a comma-separated list
                return value.split(',')[0].strip()
        
        # Fall back to REMOTE_ADDR if no proxy headers
        return request.META.get('REMOTE_ADDR', '0.0.0.0')
    
    ip = get_client_ip(request)
    
    # Add user info if authenticated
    if request.user.is_authenticated:
        ip = f"{ip} ({request.user.username})"
    
    # Track the access with enhanced metadata
    file_access_tracker.add_access(file_path, ip)
    
    try:
        data = minio_client.get_object(bucket_name=settings.MINIO_BUCKET_NAME, object_name=file_path)
        
        # More comprehensive content type detection
        content_type = 'application/octet-stream'
        file_ext = file_path.split('.')[-1].lower() if '.' in file_path else ''
        
        if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
            content_type = f'image/{file_ext}'
        elif file_ext in ['pdf']:
            content_type = 'application/pdf'
        elif file_ext in ['mp4', 'webm', 'ogg']:
            content_type = f'video/{file_ext}'
        elif file_ext in ['mp3', 'wav']:
            content_type = f'audio/{file_ext}'
        elif file_ext in ['txt']:
            content_type = 'text/plain'
        elif file_ext in ['html', 'htm']:
            content_type = 'text/html'
        elif file_ext in ['css']:
            content_type = 'text/css'
        elif file_ext in ['js']:
            content_type = 'application/javascript'
        elif file_ext in ['json']:
            content_type = 'application/json'
        elif file_ext in ['xml']:
            content_type = 'application/xml'
        
        response = HttpResponse(data.read(), content_type=content_type)
        filename = file_path.split("/")[-1]
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        
        # Add cache control headers if not an authenticated resource
        if not request.user.is_authenticated:
            response['Cache-Control'] = 'public, max-age=3600'  # 1 hour cache
        else:
            response['Cache-Control'] = 'private, max-age=600'  # 10 minutes for authenticated users
        
        return response
    except Exception as e:
        traceback.print_exc()
        raise Http404("File not found")
    

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def compress_image(self, image, max_size=(1600, 1200), quality=95):
        img = Image.open(image)
        
        # Convert RGBA to RGB if needed, with white background
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
            else:
                background.paste(img, mask=img.split()[1])  # Use alpha channel as mask
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Calculate new dimensions while maintaining aspect ratio
        width, height = img.size
        if width > max_size[0] or height > max_size[1]:
            ratio = min(max_size[0]/width, max_size[1]/height)
            new_size = (int(width * ratio), int(height * ratio))
            # Use Lanczos resampling (replacement for ANTIALIAS)
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        # Save the image
        img_io = io.BytesIO()
        save_format = 'JPEG' if image.content_type == 'image/jpeg' else 'PNG'
        if save_format == 'JPEG':
            img.save(img_io, format=save_format, quality=quality, optimize=True)
        else:
            img.save(img_io, format=save_format, optimize=True)
        
        img_io.seek(0)
        return img_io, save_format.lower()

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
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

        # Get display name without extension
        if '.' in file.name:
            display_name = file.name.rsplit('.', 1)[0]
        else:
            display_name = file.name

        if compress_image and file.content_type.startswith('image'):
            compressed_file, image_format = self.compress_image(file)
            extension = 'jpg' if image_format == 'jpeg' else image_format
            object_name = f"uploads/{request.user.id}/compressed_{random_str}_{file.name.rsplit('.', 1)[0]}.{extension}"
            file_to_save = compressed_file
            content_type = f'image/{image_format}'
        else:
            object_name = f"uploads/{request.user.id}/{random_str}_{file.name}"
            file_to_save = file
            content_type = file.content_type

        if isinstance(file_to_save, io.BytesIO):
            file_data = file_to_save
        else:
            file_data = io.BytesIO(file_to_save.read())

        url = "/api/note/files/" + self.save_to_minio(file_data, object_name, content_type)
        
        if url:
            file_obj = File.objects.create(
                name=display_name,
                original_name=file.name,
                size=file_data.getbuffer().nbytes,
                content_type=content_type,
                minio_path=object_name,
                user=request.user
            )
            
            note_id = request.POST.get('note_id')
            if note_id:
                try:
                    from ..models import LocalMessage
                    note = LocalMessage.objects.get(id=note_id, user=request.user)
                    # Auto-rename if duplicate name
                    existing_names = set(note.files.values_list('name', flat=True))
                    base_name = display_name
                    name = base_name
                    counter = 1
                    while name in existing_names:
                        name = f"{base_name} ({counter})"
                        counter += 1
                    file_obj.name = name
                    note.files.add(file_obj)
                except LocalMessage.DoesNotExist:
                    pass
            
            return Response({
                'url': url, 
                'file_id': file_obj.id, 
                'file_name': file_obj.name,
                'file': FileSerializer(file_obj).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to upload file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class NoteFilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, note_id):
        note = get_object_or_404(LocalMessage, id=note_id, user=request.user)
        files = note.files.all()
        serializer = FileSerializer(files, many=True)
        return Response(serializer.data)

    def post(self, request, note_id):
        # Add existing file to note
        file_id = request.data.get('file_id')
        if not file_id:
            return Response({'error': 'file_id required'}, status=400)
        note = get_object_or_404(LocalMessage, id=note_id, user=request.user)
        file_obj = get_object_or_404(File, id=file_id, user=request.user)
        note.files.add(file_obj)
        return Response(status=201)

    def delete(self, request, note_id):
        # Remove file from note
        file_id = request.data.get('file_id')
        if not file_id:
            return Response({'error': 'file_id required'}, status=400)
        note = get_object_or_404(LocalMessage, id=note_id, user=request.user)
        file_obj = get_object_or_404(File, id=file_id, user=request.user)
        note.files.remove(file_obj)
        # If no notes reference the file, delete it
        if not file_obj.notes.exists():
            file_obj.delete()
        return Response(status=204)


class FileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, file_id):
        file_obj = get_object_or_404(File, id=file_id, user=request.user)
        # Delete all notes referring to this file
        notes = list(file_obj.notes.all())  # copy list
        for note in notes:
            note.delete()
        # File.delete() will handle MinIO
        file_obj.delete()
        return Response(status=204)


class FileListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        files = File.objects.filter(user=request.user).prefetch_related('notes', 'collections')
        
        file_data = []
        for file in files:
            notes = file.notes.filter(user=request.user)
            collections = file.collections.filter(user=request.user)
            
            file_data.append({
                'id': file.id,
                'name': file.name,
                'original_name': file.original_name,
                'size': file.size,
                'content_type': file.content_type,
                'uploaded_at': file.uploaded_at,
                'url': f"/api/note/files/{file.minio_path}",
                'note_count': notes.count(),
                'collection_count': collections.count(),
                'notes': [{
                    'id': note.id,
                    'text': note.text[:100] + ('...' if len(note.text) > 100 else ''),
                    'category': note.list.name,
                    'category_slug': note.list.slug
                } for note in notes[:5]],
                'collections': [{
                    'id': collection.id,
                    'name': collection.name,
                    'category': collection.list.name,
                    'category_slug': collection.list.slug
                } for collection in collections[:5]]
            })
        
        return Response(file_data)
