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

def serve_minio_file(request, file_path):
    file_path = file_path.replace("note/", "")
    file_path = file_path[:-1] if file_path.endswith("/") else file_path
    print(f"file_path is {file_path}")
    try:
        data = minio_client.get_object(bucket_name=settings.MINIO_BUCKET_NAME, object_name=file_path)
        
        content_type = 'application/octet-stream'
        if file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            content_type = f'image/{file_path.split(".")[-1].lower()}'
        
        response = HttpResponse(data.read(), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{file_path.split("/")[-1]}"'
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

        if compress_image and file.content_type.startswith('image'):
            compressed_file, image_format = self.compress_image(file)
            extension = 'jpg' if image_format == 'jpeg' else image_format
            object_name = f"uploads/compressed_{file.name.rsplit('.', 1)[0]}.{extension}"
            file_to_save = compressed_file
            content_type = f'image/{image_format}'
        else:
            object_name = f"uploads/{file.name}"
            file_to_save = file
            content_type = file.content_type

        if isinstance(file_to_save, io.BytesIO):
            file_data = file_to_save
        else:
            file_data = io.BytesIO(file_to_save.read())

        url = "/api/note/files/" + self.save_to_minio(file_data, object_name, content_type)
        
        if url:
            return Response({'url': url}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to upload file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)