import string
import random

from django.db import models
from django.template.defaultfilters import slugify

# from django_resized import ResizedImageField
from django.utils import timezone

import difflib

class NoteRevision(models.Model):
    note_id = models.IntegerField()
    revision_text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    previous_revision = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    diff_text = models.TextField()

    class Meta:
        db_table = 'note_revision'
        ordering = ['-created_at']

    @staticmethod
    def create_diff(old_text, new_text):
        differ = difflib.ndiff(old_text.splitlines(keepends=True), 
                              new_text.splitlines(keepends=True))
        return ''.join(differ)

    @staticmethod
    def apply_diff(base_text, diff_text):
        result = []
        base_lines = base_text.splitlines(keepends=True)
        diff_lines = diff_text.splitlines(keepends=True)
        
        i = 0
        for diff_line in diff_lines:
            if diff_line.startswith('  '):
                result.append(base_lines[i])
                i += 1
            elif diff_line.startswith('- '):
                i += 1
            elif diff_line.startswith('+ '):
                result.append(diff_line[2:])
        
        return ''.join(result)


class LocalMessageList(models.Model):
    name = models.CharField(max_length=255, default="", unique=True)
    slug = models.SlugField(default="n")
    archived = models.BooleanField(default=False, null=False)
    show_in_feed = models.BooleanField(default=True, null=False)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(LocalMessageList, self).save(*args, **kwargs)


def get_image_upload_path(instance, filename):
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return f'images/{instance.id}-{random_str}-{filename}'

def get_file_upload_path(instance, filename):
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return f'files/{instance.id}-{random_str}-{filename}'

class LocalMessage(models.Model):
    text = models.TextField(blank=True)
    list = models.ForeignKey(LocalMessageList, on_delete=models.CASCADE, default=1)
    pinned = models.BooleanField(default=False)
    # image = ResizedImageField(upload_to=get_image_upload_path, size=[1024, 1024], blank=True, null=True)
    # file = models.FileField(upload_to=get_file_upload_path, blank=True, null=True)
    archived = models.BooleanField(default=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Link(models.Model):
    source_message = models.ForeignKey(LocalMessage, on_delete=models.CASCADE, related_name='dest_links')
    dest_message = models.ForeignKey(LocalMessage, on_delete=models.CASCADE, related_name='source_links')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


from django.conf import settings

from django.db import models
import requests
import sqlite3
import sqlite_vec
import json

class NoteEmbedding(models.Model):
    note_id = models.IntegerField(unique=True)  # Add unique constraint
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'note_embeddings'

    @staticmethod
    def get_embedding_db_path():
        """Get the path to the embeddings database"""
        from django.conf import settings
        db_settings = settings.DATABASES['embeddings']
        return db_settings['NAME']

    @staticmethod
    def setup_vector_table():
        """Setup the vector table in the embeddings database"""
        db_path = NoteEmbedding.get_embedding_db_path()
        db = sqlite3.connect(db_path)
        db.enable_load_extension(True)
        sqlite_vec.load(db)
        
        # Create the vector table with explicit rowid primary key
        db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS note_embeddings_vec 
            USING vec0(
                embedding float[768]
            );
        """)
        
        db.commit()
        db.close()
    @staticmethod
    def hasRTL(text):
        """Check if text contains any Arabic RTL characters"""
        import re
        return bool(re.compile(r'[\u0600-\u06FF]').search(text))

    @staticmethod
    def get_embedding(text):
        response = requests.post(
            f'{settings.OLLAMA_URL}/api/embed',
            json={
                "model": "nomic-embed-text",    
                "input": text
            }
        )
        if response.status_code == 200:
            return response.json()['embeddings'][0]
        raise Exception(f"Failed to get embedding: {response.text}")

    @classmethod
    def create_for_note(cls, note):
        """Class method to create embedding for a note"""
        try:
            # Check if note contains non-ASCII characters
            if cls.hasRTL(note.text):
                return None
                
            # First delete any existing embedding for this note
            cls.objects.filter(note_id=note.id).delete()
            
            # Create the embedding record
            embedding = cls.objects.create(note_id=note.id)
            
            # Get embedding vector from ollama
            vector = cls.get_embedding(note.text)
            
            # Get database path and create new connection
            db_path = cls.get_embedding_db_path()
            db = sqlite3.connect(db_path)
            db.enable_load_extension(True)
            sqlite_vec.load(db)
            
            # First delete any existing vector for this note
            db.execute(
                "DELETE FROM note_embeddings_vec WHERE rowid = ?",
                [note.id]
            )

                
            # Insert new vector
            db.execute(
                """
                INSERT INTO note_embeddings_vec(rowid, embedding) 
                VALUES (?, json(?))
                """,
                [note.id, json.dumps(vector)]
            )
            
            db.commit()
            db.close()
            
            return embedding
            
        except Exception as e:
            # Log the error and re-raise
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to process embedding for note {note.id}: {str(e)}")
            raise

    @staticmethod
    def find_similar_notes(note_id, limit=4):
        # Get database path and create new connection
        db_path = NoteEmbedding.get_embedding_db_path()
        db = sqlite3.connect(db_path)
        db.enable_load_extension(True)
        sqlite_vec.load(db)
        
        # First get the embedding for the target note
        cursor = db.cursor()
        cursor.execute(
            """
            SELECT embedding 
            FROM note_embeddings_vec 
            WHERE rowid = ?
            """,
            [note_id]
        )
        result = cursor.fetchone()
        if not result:
            db.close()
            return []
        
        target_embedding = result[0]
        
        # Find similar notes
        cursor.execute(
            """
            SELECT 
                rowid,
                distance
            FROM note_embeddings_vec
            WHERE embedding MATCH ? 
                AND rowid != ?
                AND k = ?
            """,
            [target_embedding, note_id, limit]
        )
        
        results = [{'note_id': row[0], 'distance': row[1]} 
                  for row in cursor.fetchall()]
        
        db.close()
        return results