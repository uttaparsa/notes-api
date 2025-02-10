from django.core.management.base import BaseCommand
from note.models import LocalMessage, NoteEmbedding
import traceback

class Command(BaseCommand):
    help = 'Generate embeddings for notes that have no embeddings and contain only ASCII characters'

    def handle(self, *args, **kwargs):
        # Setup vector table
        NoteEmbedding.setup_vector_table()
        
        # Get all notes
        all_notes = LocalMessage.objects.all()
        total = all_notes.count()
        
        self.stdout.write(f"Found {total} total notes")
        
        processed = 0
        skipped_non_ascii = 0
        skipped_existing = 0
        failed = 0
        
        for i, note in enumerate(all_notes, 1):
            try:
                # Check if embedding already exists
                if NoteEmbedding.objects.filter(note_id=note.id).exists():
                    skipped_existing += 1
                    continue

                if NoteEmbedding.has_non_ascii(note.text):
                    self.stdout.write(f"Skipping note {note.id}: Contains non-ASCII characters")
                    skipped_non_ascii += 1
                    continue
                    
                # Create embedding using the class method
                embedding = NoteEmbedding.create_for_note(note)
                if embedding:
                    processed += 1
                    self.stdout.write(f"Processed {i}/{total}: Note {note.id}")
                else:
                    skipped_non_ascii += 1
                    self.stdout.write(f"Skipping note {note.id}: Unable to create embedding")
                
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(
                    f"Failed to process note {note.id}: {str(e)}\n"
                    f"Traceback: {traceback.format_exc()}"
                ))
                break
        
        self.stdout.write(self.style.SUCCESS(
            f"\nFinished processing notes:\n"
            f"- Successfully processed: {processed}\n"
            f"- Skipped (already had embedding): {skipped_existing}\n"
            f"- Skipped (non-ASCII): {skipped_non_ascii}\n"
            f"- Failed: {failed}"
        ))