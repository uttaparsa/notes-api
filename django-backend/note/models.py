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

from django.db import models, connection
import requests
import re
import sqlite3
import sqlite_vec

class NoteEmbedding(models.Model):
    note = models.OneToOneField('LocalMessage', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def setup_vector_table():
        # Get the database path from Django's connection
        db_settings = connection.settings_dict
        db_path = db_settings['NAME']

        # Create a new connection to enable extensions
        db = sqlite3.connect(db_path)
        db.enable_load_extension(True)
        sqlite_vec.load(db)
        
        # Create the vector table (assumes 384-dimensional vectors from nomic-embed-text)
        db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS note_embeddings_vec 
            USING vec0(embedding float[384])
        """)
        
        db.commit()
        db.close()

    @staticmethod
    def has_non_ascii(text):
        """Check if text contains any non-ASCII characters"""
        return any(ord(char) > 127 for char in text)

    @staticmethod
    def get_embedding(text):
        response = requests.post(
            'http://192.168.0.23:11434/api/embed',
            json={
                "model": "nomic-embed-text",
                "input": text
            }
        )
        if response.status_code == 200:
            # Ollama returns embeddings as a list with a single embedding
            return response.json()['embeddings'][0]
        raise Exception(f"Failed to get embedding: {response.text}")

    def save(self, *args, **kwargs):
        # Check if note contains non-ASCII characters
        if self.has_non_ascii(self.note.text):
            # Skip saving if note contains non-ASCII characters
            return
            
        super().save(*args, **kwargs)
        
        # Get embedding from ollama
        embedding = self.get_embedding(self.note.text)
        
        # Get database path and create new connection
        db_settings = connection.settings_dict
        db_path = db_settings['NAME']
        db = sqlite3.connect(db_path)
        db.enable_load_extension(True)
        sqlite_vec.load(db)
        
        # Store in vector table
        db.execute(
            """
            INSERT OR REPLACE INTO note_embeddings_vec(rowid, embedding) 
            VALUES (?, ?)
            """,
            [self.note.id, str(embedding)]
        )
        
        db.commit()
        db.close()

    @staticmethod
    def find_similar_notes(note_id, limit=5):
        # Get database path and create new connection
        db_settings = connection.settings_dict
        db_path = db_settings['NAME']
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