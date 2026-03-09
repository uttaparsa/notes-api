import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0002_emailconfirmationtoken'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_channel', models.CharField(choices=[('email', 'Email'), ('telegram', 'Telegram')], default='email', max_length=20)),
                ('telegram_bot_token', models.CharField(blank=True, default='', max_length=255)),
                ('telegram_chat_id', models.CharField(blank=True, default='', max_length=100)),
                ('telegram_webhook_secret', models.UUIDField(default=uuid.uuid4, editable=False)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_profiles',
            },
        ),
    ]
