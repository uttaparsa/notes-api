from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0023_file_file_hash'),
    ]

    operations = [
        migrations.CreateModel(
            name='TelegramReminderMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_id', models.BigIntegerField()),
                ('sent_at', models.DateTimeField(auto_now_add=True)),
                ('reminder', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='telegram_messages', to='note.reminder')),
            ],
            options={
                'db_table': 'telegram_reminder_messages',
            },
        ),
    ]
