from django.core.management.base import BaseCommand
from note.models import LocalMessage, File
from note.file_utils import FileManager
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Migrate existing embedded files in notes to File model'

    def handle(self, *args, **options):
        file_manager = FileManager()
        notes = LocalMessage.objects.all()
        total_migrated = 0
        
        for note in notes:
            file_paths = file_manager.extract_file_paths(note.text)
            for path in file_paths:
                # Remove note/ prefix if present
                minio_path = path.replace("note/", "")
                
                # Check if File already exists
                file_obj, created = File.objects.get_or_create(
                    minio_path=minio_path,
                    defaults={
                        'name': minio_path.split('/')[-1],  # filename from path
                        'original_name': minio_path.split('/')[-1],
                        'size': 0,  # Will be updated later if needed
                        'content_type': 'unknown',
                        'user': note.user
                    }
                )
                
                # Associate with note if not already
                if not note.files.filter(id=file_obj.id).exists():
                    note.files.add(file_obj)
                    total_migrated += 1
                    self.stdout.write(f"Migrated {minio_path} to note {note.id}")
        
        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {total_migrated} file associations"))