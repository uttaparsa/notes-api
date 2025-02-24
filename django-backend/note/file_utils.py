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
                print(f"file {file_path} was referenced elsewhere!")
                    
        return deleted_files
    
from django.utils import timezone
from datetime import timedelta
from collections import OrderedDict, defaultdict
import threading

class FileAccessTracker:
    def __init__(self, max_age_days=30, max_entries=1000):
        # IP-centric access log: {ip: {file_path: timestamp}}
        self.ip_access_log = OrderedDict()
        
        # File-centric access log (maintain for backward compatibility): {file_path: {ip: timestamp}}
        self.file_access_log = OrderedDict()
        
        self.lock = threading.Lock()  # Thread-safe operations
        self.max_age = timedelta(days=max_age_days)
        self.max_entries = max_entries  # Prevent memory issues by limiting total entries

    def add_access(self, file_path, ip):
        with self.lock:
            # Update IP-centric log
            if ip not in self.ip_access_log:
                self.ip_access_log[ip] = OrderedDict()
            
            # Update access time for this file path
            self.ip_access_log[ip][file_path] = timezone.now()
            
            # Move this IP to the front (most recent)
            self.ip_access_log.move_to_end(ip, last=False)
            
            # Update file-centric log (for compatibility)
            if file_path not in self.file_access_log:
                self.file_access_log[file_path] = OrderedDict()
            
            self.file_access_log[file_path][ip] = timezone.now()
            
            # Clean up old entries
            self._cleanup()

    def get_recent_ip_accesses(self, limit=50):
        """Get most recent IPs and their accessed files"""
        with self.lock:
            result = OrderedDict()
            
            # Take slice of top IPs
            for ip, files in list(self.ip_access_log.items())[:limit]:
                # Get the most recent file access time for this IP
                if files:
                    most_recent_time = max(files.values())
                    
                    # Only include if within max_age
                    if timezone.now() - most_recent_time <= self.max_age:
                        # Get all accessed files for this IP
                        result[ip] = {
                            'last_access': most_recent_time,
                            'files': [
                                {'path': path, 'timestamp': timestamp.isoformat()}
                                for path, timestamp in sorted(
                                    files.items(), 
                                    key=lambda x: x[1], 
                                    reverse=True
                                )
                                if timezone.now() - timestamp <= self.max_age
                            ][:10]  # Limit to 10 most recent files per IP
                        }
            
            return result

    def get_recent_file_accesses(self, file_path):
        """For backward compatibility"""
        with self.lock:
            if file_path not in self.file_access_log:
                return {}
            
            # Filter out old accesses
            current_time = timezone.now()
            recent = {
                ip: timestamp
                for ip, timestamp in self.file_access_log[file_path].items()
                if current_time - timestamp <= self.max_age
            }
            return recent

    def _cleanup(self):
        """Clean up old entries and limit total size"""
        current_time = timezone.now()
        
        # Clean up IP-centric log
        for ip in list(self.ip_access_log.keys()):
            # Filter recent file accesses
            valid_files = {
                path: timestamp 
                for path, timestamp in self.ip_access_log[ip].items()
                if current_time - timestamp <= self.max_age
            }
            
            if valid_files:
                self.ip_access_log[ip] = OrderedDict(
                    sorted(valid_files.items(), key=lambda x: x[1], reverse=True)
                )
            else:
                # Remove IP if no recent accesses
                del self.ip_access_log[ip]
        
        # Clean up file-centric log
        for file_path in list(self.file_access_log.keys()):
            valid_ips = {
                ip: timestamp 
                for ip, timestamp in self.file_access_log[file_path].items()
                if current_time - timestamp <= self.max_age
            }
            
            if valid_ips:
                self.file_access_log[file_path] = OrderedDict(
                    sorted(valid_ips.items(), key=lambda x: x[1], reverse=True)
                )
            else:
                # Remove file entry if no recent accesses
                del self.file_access_log[file_path]
        
        # Limit total entries if exceeding max_entries
        while len(self.ip_access_log) > self.max_entries:
            # Remove oldest IP (last in OrderedDict)
            self.ip_access_log.popitem(last=True)

# Create singleton instance
file_access_tracker = FileAccessTracker()