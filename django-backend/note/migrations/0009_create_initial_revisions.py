# note/migrations/XXXX_create_initial_revisions.py
from django.db import migrations

def create_initial_revisions(apps, schema_editor):
    LocalMessage = apps.get_model('note', 'LocalMessage')
    NoteRevision = apps.get_model('note', 'NoteRevision')

    # Use the DB alias that this migration is running on
    db_alias = schema_editor.connection.alias

    # If you want to only run this on a dedicated DB (e.g. 'revision'), uncomment:
    # if db_alias != 'revision':
    #     return

    for note in LocalMessage.objects.using(db_alias).all():
        # Check if this note already has any revisions (on the same DB)
        if not NoteRevision.objects.using(db_alias).filter(note_id=note.id).exists():
            # Create initial revision only if none exists
            NoteRevision.objects.using(db_alias).create(
                note_id=note.id,
                revision_text=note.text,  # Original text
                previous_revision=None,   # No previous revision for initial state
                diff_text=''              # No diff for initial revision
            )

def reverse_initial_revisions(apps, schema_editor):
    NoteRevision = apps.get_model('note', 'NoteRevision')
    db_alias = schema_editor.connection.alias

    # If you only applied the forward step on a specific DB, mirror that check here:
    if db_alias != 'revision':
        return

    NoteRevision.objects.using(db_alias).all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('note', '0008_noterevision'),  # Your revision model migration
    ]

    operations = [
        migrations.RunPython(create_initial_revisions, reverse_initial_revisions),
    ]