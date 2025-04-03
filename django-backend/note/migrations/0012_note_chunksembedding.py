from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('note', '0011_noteembedding'),  # Assume this is the next sequence after '0010_localmessagelist_show_in_feed'
    ]
    
    operations = [
        migrations.CreateModel(
            name='NoteChunk',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('note_id', models.IntegerField()),  # Using IntegerField instead of ForeignKey
                ('chunk_index', models.IntegerField()),
                ('chunk_text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'note_chunks',
                'ordering': ['note_id', 'chunk_index'],
                'unique_together': {('note_id', 'chunk_index')},
            },
        ),
    ]