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
def create_embedding_async(note_id):
    """
    Asynchronously create embedding for a note
    """
    try:
        # Get a fresh instance of the note to avoid any thread-related issues
        note = LocalMessage.objects.get(id=note_id)
        
        # Skip if embedding already exists (double-check in case of race conditions)
        if NoteEmbedding.objects.filter(note=note).exists():
            return
            
        # Skip if note contains non-ASCII characters
        if not NoteEmbedding.has_non_ascii(note.text):
            NoteEmbedding.objects.create(note=note)
            
    except Exception as e:
        print(f"Failed to create embedding for note {note_id}: {str(e)}")

@receiver(post_save, sender=LocalMessage)
def trigger_embedding_creation(sender, instance, created, **kwargs):
    """
    Signal to trigger asynchronous embedding creation for new notes
    """
    if created:  # Only for new notes
        create_embedding_async(instance.id)