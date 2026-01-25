import string
import random

from django.db import models
from django.db.models import Q
from django.template.defaultfilters import slugify
from django.contrib.auth.models import User

# from django_resized import ResizedImageField
from django.utils import timezone

import difflib
import json
import sqlite3
import sqlite_vec
import requests
from django.conf import settings

# Import the LangChain markdown text splitter
from langchain_text_splitters import (
    Language,
    RecursiveCharacterTextSplitter,
    MarkdownHeaderTextSplitter,
)

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
    name = models.CharField(max_length=255, default="")
    slug = models.SlugField(default="n")
    disable_related = models.BooleanField(default=False, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_lists')
    workspaces = models.ManyToManyField('Workspace', related_name='categories', blank=True)

    class Meta:
        unique_together = ('name', 'user')

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(LocalMessageList, self).save(*args, **kwargs)


class Workspace(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspaces')
    default_category = models.ForeignKey(LocalMessageList, on_delete=models.SET_NULL, null=True, blank=True, related_name='default_for_workspaces')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'user')

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        # Ensure only one default workspace per user
        if self.is_default:
            Workspace.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super(Workspace, self).save(*args, **kwargs)

    def get_visible_categories(self):
        """Get categories visible in this workspace"""
        # Regular workspace shows only categories assigned to it
        return self.categories.all()

    @property
    def is_archived_category(self, category):
        """Check if a category is considered archived in this workspace"""
        if self.is_default:
            return False  # No categories are archived anymore
        else:
            return not self.categories.filter(id=category.id).exists()


def get_image_upload_path(instance, filename):
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return f'images/{instance.id}-{random_str}-{filename}'

def get_file_upload_path(instance, filename):
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return f'files/{instance.id}-{random_str}-{filename}'

import re
class LocalMessage(models.Model):
    text = models.TextField(blank=True)
    list = models.ForeignKey(LocalMessageList, on_delete=models.CASCADE, default=1)
    importance = models.IntegerField(default=0)
    archived = models.BooleanField(default=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    
    def split_into_chunks(self):
        """Split the note content into chunks using hierarchical splitting: first by headers, then by character count"""
        
        # Extract code blocks
        code_blocks = []
        text_without_code_blocks = self.text
        
        # Regex pattern for triple backtick code blocks
        pattern = r"```(?:[a-zA-Z0-9]*\n)?(.*?)```"
        
        # Find all code blocks
        matches = re.finditer(pattern, self.text, re.DOTALL)
        offset = 0
        
        # Extract code blocks and remove them from text
        for match in matches:
            code_block = match.group(1).strip()
            code_blocks.append(code_block)
            
            # Replace the code block with a placeholder to maintain text integrity
            start, end = match.span()
            start -= offset
            end -= offset
            text_without_code_blocks = text_without_code_blocks[:start] + " [CODE_BLOCK_PLACEHOLDER] " + text_without_code_blocks[end:]
            offset += (end - start) - len(" [CODE_BLOCK_PLACEHOLDER] ")
        

        # Define headers to split on
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
            ("####", "Header 4"),
            ("#####", "Header 5"),
            ("######", "Header 6"),
        ]
        
        # First split by markdown headers
        markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on, strip_headers=False
        )

        md_header_splits = markdown_splitter.split_text(text_without_code_blocks)
        
        # Then apply character-level splitting to the header-split documents
        chunk_size = 750
        chunk_overlap = 30
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        
        # Split the header-split documents further by character count
        splits = text_splitter.split_documents(md_header_splits)
        
        # Create and save NoteChunk objects for each chunk
        note_chunks = []
        chunk_index = 0
        
        for doc in splits:
            note_chunk = NoteChunk.objects.create(
                note_id=self.id,
                chunk_index=chunk_index,
                chunk_text=doc.page_content,
            )
            note_chunks.append(note_chunk)
            chunk_index += 1

                # Then add code blocks as separate chunks

        for code_block in code_blocks:
            note_chunk = NoteChunk.objects.create(
                note_id=self.id,
                chunk_index=chunk_index,
                chunk_text=code_block,
            )
            note_chunks.append(note_chunk)
            chunk_index += 1
        
        return note_chunks
    
    def update_chunks(self):
        """Update chunks for this note"""
        # Delete existing chunks
        NoteChunk.objects.filter(note_id=self.id).delete()
        
        # Create new chunks
        return self.split_into_chunks()

    def delete(self, *args, **kwargs):
        note_id_to_delete = self.id

        # Get database path for vector embeddings
        db_path = NoteEmbedding.get_embedding_db_path()
        
        try:
            db = sqlite3.connect(db_path)
            db.enable_load_extension(True)
            sqlite_vec.load(db)
            cursor = db.cursor()

            # 1. Delete main note's embedding from note_embeddings_vec
            cursor.execute(
                "DELETE FROM note_embeddings_vec WHERE rowid = ?",
                [note_id_to_delete]
            )

            # 2. Delete NoteChunk embeddings from note_chunk_embeddings_vec
            # Retrieve all chunks for this note to get their chunk_index
            chunks_to_delete = NoteChunk.objects.filter(note_id=note_id_to_delete)
            for chunk in chunks_to_delete:
                chunk_rowid = (chunk.note_id * 10000) + chunk.chunk_index
                cursor.execute(
                    "DELETE FROM note_chunk_embeddings_vec WHERE rowid = ?",
                    [chunk_rowid]
                )
            
            db.commit()
        except sqlite3.Error as e:
            # Log error or handle as needed
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error deleting embeddings from vector DB for note {note_id_to_delete}: {e}")
            # Depending on policy, you might re-raise or allow deletion of Django objects to proceed
        finally:
            if 'db' in locals() and db:
                db.close()

        # 3. Delete NoteEmbedding Django model instance
        NoteEmbedding.objects.filter(note_id=note_id_to_delete).delete()

        # 4. Delete NoteChunk Django model instances
        # This will also be handled by the loop above if we delete them one by one,
        # but a bulk delete is more efficient.
        NoteChunk.objects.filter(note_id=note_id_to_delete).delete()
        
        # 5. Call the superclass's delete method
        super(LocalMessage, self).delete(*args, **kwargs)


class Link(models.Model):
    source_message = models.ForeignKey(LocalMessage, on_delete=models.CASCADE, related_name='dest_links')
    dest_message = models.ForeignKey(LocalMessage, on_delete=models.CASCADE, related_name='source_links')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


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
        db.execute(f"""
            CREATE VIRTUAL TABLE IF NOT EXISTS note_embeddings_vec 
            USING vec0(
                embedding float[{settings.OLLAMA_EMBEDDING_SIZE}]
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
                "model": settings.OLLAMA_MODEL,    
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

    @classmethod
    def find_similar_notes_by_embedding(cls, text_embedding, limit=5, exclude_note_id=None):
        """Find similar notes based on a given text embedding."""
        if text_embedding is None:
            return []

        db_path = cls.get_embedding_db_path()
        db = sqlite3.connect(db_path)
        db.enable_load_extension(True)
        sqlite_vec.load(db)
        cursor = db.cursor()

        query_params = [json.dumps(text_embedding)]
        
        base_query = """
            SELECT rowid, distance
            FROM note_embeddings_vec
            WHERE embedding MATCH ?1
        """
        
        if exclude_note_id is not None:
            base_query += " AND rowid != ?2"
            query_params.append(exclude_note_id)
            base_query += " AND k = ?3" # k is limit
            query_params.append(limit)
        else:
            base_query += " AND k = ?2" # k is limit
            query_params.append(limit)
            
        cursor.execute(base_query, query_params)
        
        results = [{'note_id': row[0], 'distance': row[1]} 
                   for row in cursor.fetchall()]
        
        db.close()
        return results

    @staticmethod
    def find_similar_notes_by_text(text, limit=5, exclude_note_id=None):
        """Find similar notes based on a given text."""
        try:
            # Generate embedding for the input text
            text_embedding = NoteEmbedding.get_embedding(text)
            
            # Use the existing method to find similar notes by embedding
            return NoteEmbedding.find_similar_notes_by_embedding(
                text_embedding=text_embedding,
                limit=limit,
                exclude_note_id=exclude_note_id
            )
        except Exception as e:
            # Log the error and return empty list
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to find similar notes by text: {str(e)}")
            return []

# New model for storing note chunks and their embeddings
class NoteChunk(models.Model):
    note_id = models.IntegerField()  # Foreign key to the parent note
    chunk_index = models.IntegerField()  # Index of this chunk within the note
    chunk_text = models.TextField()  # The content of this chunk
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'note_chunks'
        # Ensure each chunk has a unique combination of note_id and chunk_index
        unique_together = ('note_id', 'chunk_index')
        # Order chunks by note_id and then by chunk_index
        ordering = ['note_id', 'chunk_index']
    
    @staticmethod
    def setup_vector_table():
        """Setup the vector table for chunk embeddings in the database"""
        db_path = NoteEmbedding.get_embedding_db_path()
        db = sqlite3.connect(db_path)
        db.enable_load_extension(True)
        sqlite_vec.load(db)
        
        # Create the vector table for chunks with composite primary key
        db.execute(f"""
            CREATE VIRTUAL TABLE IF NOT EXISTS note_chunk_embeddings_vec 
            USING vec0(
                embedding float[{settings.OLLAMA_EMBEDDING_SIZE}]
            );
        """)
        
        db.commit()
        db.close()
    
    @staticmethod
    def hasRTL(text):
        """Check if text contains any Arabic RTL characters"""
        # Reuse the existing method from NoteEmbedding
        return NoteEmbedding.hasRTL(text)
    
    @staticmethod
    def get_embedding(text):
        """Get embedding for a chunk of text"""
        # Reuse the existing method from NoteEmbedding
        return NoteEmbedding.get_embedding(text)
    
    def create_embedding(self):
        """Create an embedding for this chunk"""
        try:
            # Check if chunk contains non-ASCII characters
            if self.hasRTL(self.chunk_text):
                return None
            
            # Get embedding vector from ollama
            vector = self.get_embedding(self.chunk_text)
            
            # Get database path and create new connection
            db_path = NoteEmbedding.get_embedding_db_path()
            db = sqlite3.connect(db_path)
            db.enable_load_extension(True)
            sqlite_vec.load(db)
            
            # Generate a unique rowid for this chunk
            # Format: noteId + 10000 + chunkIndex (to avoid collisions with note IDs)
            chunk_rowid = (self.note_id * 10000) + self.chunk_index
            
            # First delete any existing vector for this chunk
            db.execute(
                "DELETE FROM note_chunk_embeddings_vec WHERE rowid = ?",
                [chunk_rowid]
            )
            
            # Insert new vector
            db.execute(
                """
                INSERT INTO note_chunk_embeddings_vec(rowid, embedding) 
                VALUES (?, json(?))
                """,
                [chunk_rowid, json.dumps(vector)]
            )
            
            db.commit()
            db.close()
            
            return True
            
        except Exception as e:
            # Log the error and re-raise
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to process embedding for chunk {self.id}: {str(e)}")
            raise
    
    @staticmethod
    def find_similar_chunks(chunk_text, limit=10, exclude_note_id=None):
        """Find chunks similar to the given text"""
        try:
            # Get embedding for the input text
            vector = NoteChunk.get_embedding(chunk_text)
            
            # Get database path and create new connection
            db_path = NoteEmbedding.get_embedding_db_path()
            db = sqlite3.connect(db_path)
            db.enable_load_extension(True)
            sqlite_vec.load(db)
            
            cursor = db.cursor()
            
            # Find similar chunks
            query = """
                SELECT 
                    rowid,
                    distance
                FROM note_chunk_embeddings_vec
                WHERE embedding MATCH ?
                AND k = ?
            """
            params = [json.dumps(vector), limit]
            
            # If we need to exclude chunks from a specific note
            if exclude_note_id is not None:
                # Calculate the range of rowids to exclude
                # Each note's chunks use IDs in the format noteId*10000 + chunkIndex
                min_exclude = exclude_note_id * 10000
                max_exclude = (exclude_note_id + 1) * 10000 - 1
                
                query += " AND (rowid < ? OR rowid > ?)"
                params.extend([min_exclude, max_exclude])
            
            cursor.execute(query, params)
            
            # Process the results
            results = []
            for row in cursor.fetchall():
                rowid = row[0]
                distance = row[1]
                
                # Calculate the original note_id and chunk_index from the rowid
                note_id = rowid // 10000
                chunk_index = rowid % 10000
                
                results.append({
                    'note_id': note_id,
                    'chunk_index': chunk_index,
                    'distance': distance
                })
            
            db.close()
            
            # Fetch the actual chunks from the database
            chunk_details = []
            for result in results:
                try:
                    chunk = NoteChunk.objects.get(
                        note_id=result['note_id'],
                        chunk_index=result['chunk_index']
                    )
                    
                    chunk_details.append({
                        'note_id': result['note_id'],
                        'chunk_index': result['chunk_index'],
                        'chunk_text': chunk.chunk_text,
                        'distance': result['distance']
                    })
                except NoteChunk.DoesNotExist:
                    # Skip if the chunk doesn't exist anymore
                    continue
            
            return chunk_details
            
        except Exception as e:
            # Log the error and return empty list
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to find similar chunks: {str(e)}")
            return []

class Reminder(models.Model):
    FREQUENCY_CHOICES = [
        ('once', 'Once'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    note = models.ForeignKey(LocalMessage, on_delete=models.CASCADE, related_name='reminders')
    description = models.TextField(blank=True, default='')
    
    # Text selection range (character positions)
    highlight_start = models.IntegerField(null=True, blank=True)
    highlight_end = models.IntegerField(null=True, blank=True)
    
    # Scheduling
    scheduled_time = models.DateTimeField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='once')
    is_active = models.BooleanField(default=True)
    last_sent = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reminders'
        ordering = ['scheduled_time']
    
    def get_note_url(self):
        """Generate the URL for this reminder"""
        base_url = f"/message/{self.note.id}"
        if self.highlight_start is not None and self.highlight_end is not None:
            return f"{base_url}?highlight_start={self.highlight_start}&highlight_end={self.highlight_end}"
        return base_url
    
    def get_highlighted_text(self):
        """Get the highlighted portion of the note"""
        if self.highlight_start is not None and self.highlight_end is not None:
            return self.note.text[self.highlight_start:self.highlight_end]
        return self.note.text
