from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0024_telegramremindermessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='reminder',
            name='is_snoozed',
            field=models.BooleanField(default=False),
        ),
    ]
