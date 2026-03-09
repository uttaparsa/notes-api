from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0026_reminder_snoozed_until'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='reminder',
            name='is_snoozed',
        ),
    ]
