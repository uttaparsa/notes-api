from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LocalMessage, NoteEmbedding
import threading
import functools

def async_task(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        thread = threading.Thread(target=func, args=args, kwargs=kwargs)
        thread.daemon = True  # Make thread daemon so it doesn't block program exit
        thread.start()
    return wrapper

@async_task
def create_or_update_embedding_async(note_id):
    """
    Asynchronously create or update embedding for a note
    """
    try:
        # Get a fresh instance of the note to avoid any thread-related issues
        note = LocalMessage.objects.get(id=note_id)
        
        # Check if note contains non-ASCII characters
        if NoteEmbedding.has_non_ascii(note.text):
            # If there's an existing embedding, delete it since the note now has non-ASCII
            NoteEmbedding.objects.filter(note=note).delete()
            return
            
        # Get or create the embedding
        embedding, created = NoteEmbedding.objects.get_or_create(note=note)
        
        if not created:
            # If embedding exists, force a save to update the vector
            embedding.save()
            
    except Exception as e:
        print(f"Failed to process embedding for note {note_id}: {str(e)}")

@receiver(post_save, sender=LocalMessage)
def trigger_embedding_processing(sender, instance, created, **kwargs):
    """
    Signal to trigger asynchronous embedding creation/update for notes
    """
    create_or_update_embedding_async(instance.id)