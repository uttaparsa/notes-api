from django.core.management.base import BaseCommand
from note.models import File
from minio import Minio
from minio.commonconfig import CopySource
from django.conf import settings
from urllib.parse import unquote

class Command(BaseCommand):
    help = 'Move existing files in MinIO to user-specific folders'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be moved without actually moving',
        )
        parser.add_argument(
            '--delete-old',
            action='store_true',
            help='Delete old files after moving (use with caution)',
        )
        parser.add_argument(
            '--cleanup-db',
            action='store_true',
            help='Delete database entries for files that do not exist in MinIO',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        delete_old = options['delete_old']
        cleanup_db = options['cleanup_db']

        # Initialize MinIO client
        minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL
        )

        files = File.objects.all()
        total_moved = 0
        total_errors = 0
        total_cleaned = 0

        for file_obj in files:
            old_path = unquote(file_obj.minio_path)
            user_folder = f"uploads/{file_obj.user.id}/"
            if old_path.startswith(user_folder):
                self.stdout.write(f"File {old_path} already in correct location")
                continue
            elif old_path.startswith("uploads/"):
                relative_path = old_path[8:]  # Remove "uploads/" prefix
                new_path = f"uploads/{file_obj.user.id}/{relative_path}"
            else:
                # If not starting with uploads/, maybe already migrated or different structure
                new_path = f"uploads/{file_obj.user.id}/{old_path}"

            if old_path == new_path:
                self.stdout.write(f"File {old_path} already in correct location")
                continue

            # Check if object exists in MinIO
            try:
                minio_client.stat_object(settings.MINIO_BUCKET_NAME, old_path)
                object_exists = True
            except Exception:
                object_exists = False

            if not object_exists:
                if cleanup_db:
                    file_obj.delete()
                    self.stdout.write(f"Deleted DB entry for non-existent file {old_path}")
                    total_cleaned += 1
                else:
                    self.stdout.write(f"File {old_path} does not exist in MinIO, skipping")
                continue

            if dry_run:
                self.stdout.write(f"Would move {old_path} -> {new_path}")
                total_moved += 1
                continue

            try:
                # Copy object to new location
                copy_source = CopySource(settings.MINIO_BUCKET_NAME, old_path)
                minio_client.copy_object(
                    settings.MINIO_BUCKET_NAME,
                    new_path,
                    copy_source
                )

                # Update database
                file_obj.minio_path = new_path
                file_obj.save()

                self.stdout.write(f"Moved {old_path} -> {new_path}")

                # Optionally delete old file
                if delete_old:
                    minio_client.remove_object(settings.MINIO_BUCKET_NAME, old_path)
                    self.stdout.write(f"Deleted old file {old_path}")

                total_moved += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error moving {old_path}: {e}"))
                total_errors += 1

        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"Dry run: Would move {total_moved} files"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully moved {total_moved} files"))
            if total_errors > 0:
                self.stdout.write(self.style.WARNING(f"Errors: {total_errors}"))
            if total_cleaned > 0:
                self.stdout.write(self.style.SUCCESS(f"Cleaned up {total_cleaned} DB entries"))