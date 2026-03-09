from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0025_reminder_is_snoozed'),
    ]

    operations = [
        migrations.AddField(
            model_name='reminder',
            name='snoozed_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
