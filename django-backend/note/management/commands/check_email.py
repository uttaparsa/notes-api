from django.core.management.base import BaseCommand
from note.email_utils.recent_mails import check_for_new_emails
from django.conf import settings

class Command(BaseCommand):
    help = 'Starts the periodic email checking process'

    def handle(self, *args, **options):
        username =  settings.EMAIL_USERNAME
        password = settings.EMAIL_PASSWORD
        check_for_new_emails(username, password, interval_seconds=600, reconnect_interval=3600)