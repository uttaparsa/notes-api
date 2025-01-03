# Generated by Django 3.2.8 on 2023-12-29 08:11

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0004_localmessagelist_archived'),
    ]

    operations = [
        migrations.CreateModel(
            name='Link',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('dest_message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dest_links', to='note.localmessage')),
                ('source_message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='source_links', to='note.localmessage')),
            ],
        ),
    ]
