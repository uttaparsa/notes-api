from django.db import migrations

def create_initial_revisions(apps, schema_editor):
    LocalMessage = apps.get_model('note', 'LocalMessage')
    NoteRevision = apps.get_model('note', 'NoteRevision')
    
    for note in LocalMessage.objects.all():
        # Create initial revision with original text
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