# Generated by Django 3.2.8 on 2024-10-28 07:57

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0005_link'),
    ]

    operations = [
        migrations.AlterField(
            model_name='link',
            name='dest_message',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='source_links', to='note.localmessage'),
        ),
        migrations.AlterField(
            model_name='link',
            name='source_message',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dest_links', to='note.localmessage'),
        ),
    ]