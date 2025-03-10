# Generated by Django 5.1.2 on 2025-02-01 06:24

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0007_remove_localmessage_file_remove_localmessage_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='NoteRevision',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('note_id', models.IntegerField()),
                ('revision_text', models.TextField()),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('diff_text', models.TextField()),
                ('previous_revision', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='note.noterevision')),
            ],
            options={
                'db_table': 'note_revision',
                'ordering': ['-created_at'],
            },
        ),
    ]
