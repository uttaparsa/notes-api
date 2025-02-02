# note/migrations/XXXX_create_initial_revisions.py
from django.db import migrations

def create_initial_revisions(apps, schema_editor):
    LocalMessage = apps.get_model('note', 'LocalMessage')
    NoteRevision = apps.get_model('note', 'NoteRevision')
    
    for note in LocalMessage.objects.all():
        # Check if this note already has any revisions
        if not NoteRevision.objects.filter(note_id=note.id).exists():
            # Create initial revision only if none exists
            NoteRevision.objects.create(
                note_id=note.id,
                revision_text=note.text,  # Original text
                previous_revision=None,   # No previous revision for initial state
                diff_text=''             # No diff for initial revision
            )

def reverse_initial_revisions(apps, schema_editor):
    NoteRevision = apps.get_model('note', 'NoteRevision')
    NoteRevision.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('note', '0008_noterevision'),  # Your revision model migration
    ]

    operations = [
        migrations.RunPython(create_initial_revisions, reverse_initial_revisions),
    ]