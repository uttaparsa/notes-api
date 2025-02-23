import re
from typing import List
from django.conf import settings
from minio import Minio
from .models import LocalMessage

class FileManager:
    def __init__(self):
        self.minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL
        )
        
    def extract_file_paths(self, markdown_text: str) -> List[str]:
        """Extract file paths from markdown text that match our API pattern."""
        # Pattern to match URLs like /api/note/files/uploads/...
        pattern = r'/api/note/files/([^\s\)\"\']+)'
        matches = re.finditer(pattern, markdown_text)
        return [match.group(1) for match in matches]
    
    def is_file_referenced(self, file_path: str, exclude_note_id: int = None) -> bool:
        """Check if a file is referenced in any other notes."""
        # Query all notes except the one being deleted
        notes = LocalMessage.objects.exclude(id=exclude_note_id) if exclude_note_id else LocalMessage.objects.all()
        

        # Check each note's content for the file reference
        for note in notes:
            if file_path in note.text:
                return True
        return False
    
    def delete_unused_files(self, note_text: str, note_id: int) -> List[str]:
        """Delete files that are no longer referenced in any notes."""
        deleted_files = []
        file_paths = self.extract_file_paths(note_text)
        
        print(f"found file paths {file_paths}")

        for file_path in file_paths:
            if not self.is_file_referenced(file_path, exclude_note_id=note_id):
                # remove the leading note/ prefix
                file_path = file_path.replace("note/", "")
                try:
                    self.minio_client.remove_object(
                        bucket_name=settings.MINIO_BUCKET_NAME,
                        object_name=file_path
                    )
                    deleted_files.append(file_path)
                except Exception as e:
                    print(f"Error deleting file {file_path}: {e}")
            else: 
                print("file was referenced!")
                    
        return deleted_files