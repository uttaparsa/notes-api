from django.core.management.base import BaseCommand
from django.conf import settings
from minio import Minio
from note.models import File
import hashlib
import io


class Command(BaseCommand):
    help = 'Compute and store hashes for existing files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recompute hashes even if they already exist',
        )

    def handle(self, *args, **options):
        force = options['force']

        minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL
        )

        if force:
            files = File.objects.all()
        else:
            files = File.objects.filter(file_hash__isnull=True)

        total = files.count()
        self.stdout.write(f'Processing {total} files...')

        success_count = 0
        error_count = 0
        skipped_count = 0

        for i, file_obj in enumerate(files, 1):
            try:
                self.stdout.write(f'[{i}/{total}] Processing: {file_obj.minio_path}')
                
                response = minio_client.get_object(
                    settings.MINIO_BUCKET_NAME,
                    file_obj.minio_path
                )
                
                hasher = hashlib.sha256()
                while chunk := response.read(8192):
                    hasher.update(chunk)
                
                file_hash = hasher.hexdigest()
                file_obj.file_hash = file_hash
                file_obj.save(update_fields=['file_hash'])
                
                success_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Hash computed: {file_hash[:16]}...'))
                
            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f'  ✗ Error: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'\nCompleted!'))
        self.stdout.write(f'  Success: {success_count}')
        self.stdout.write(f'  Errors: {error_count}')
        self.stdout.write(f'  Total: {total}')
