# Generated by Django 3.2.8 on 2023-09-16 05:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('note', '0003_auto_20230211_1055'),
    ]

    operations = [
        migrations.AddField(
            model_name='localmessagelist',
            name='archived',
            field=models.BooleanField(default=False),
        ),
    ]