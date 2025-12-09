from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_email_reminder(self, recipient_email, subject, message):
    """
    Send email reminder notification.
    
    Args:
        recipient_email: Email address of the recipient
        subject: Email subject
        message: Email message body
    """
    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [recipient_email],
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {recipient_email}")
        return f"Email sent to {recipient_email}"
    except Exception as exc:
        logger.error(f"Failed to send email to {recipient_email}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)

@shared_task
def send_bulk_reminders(user_emails, subject, message):
    """
    Send bulk email reminders.
    
    Args:
        user_emails: List of email addresses
        subject: Email subject
        message: Email message body
    """
    results = []
    for email in user_emails:
        result = send_email_reminder.delay(email, subject, message)
        results.append(result.id)
    return results

@shared_task
def test_celery_task():
    """Test task to verify Celery is working"""
    logger.info("Celery test task executed successfully!")
    return "Celery is working!"
