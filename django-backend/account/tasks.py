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

@shared_task
def send_reminder_email(reminder_id):
    """
    Send a reminder email for a specific reminder.
    
    Args:
        reminder_id: ID of the reminder to send
    """
    from note.models import Reminder
    from django.utils import timezone
    from datetime import timedelta
    from django.conf import settings
    
    try:
        reminder = Reminder.objects.get(id=reminder_id, is_active=True)
        
        # Build email content
        highlighted_text = reminder.get_highlighted_text()
        note_url = f"{settings.FRONTEND_URL}{reminder.get_note_url()}"
        
        subject = f"Reminder: {reminder.description or 'Note Reminder'}"
        
        message = f"""
Hello {reminder.user.username},

This is your reminder:

{reminder.description}

Note excerpt:
{highlighted_text[:200]}{'...' if len(highlighted_text) > 200 else ''}

View full note: {note_url}

---
This is an automated reminder from your Notes app.
"""
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [reminder.user.email],
            fail_silently=False,
        )
        
        # Update last_sent time
        reminder.last_sent = timezone.now()
        
        # If it's a recurring reminder, schedule the next one
        if reminder.frequency != 'once':
            if reminder.frequency == 'daily':
                next_time = reminder.scheduled_time + timedelta(days=1)
            elif reminder.frequency == 'weekly':
                next_time = reminder.scheduled_time + timedelta(weeks=1)
            elif reminder.frequency == 'monthly':
                next_time = reminder.scheduled_time + timedelta(days=30)
            
            reminder.scheduled_time = next_time
        else:
            # Deactivate one-time reminders
            reminder.is_active = False
        
        reminder.save()
        
        logger.info(f"Reminder {reminder_id} sent successfully to {reminder.user.email}")
        return f"Reminder sent to {reminder.user.email}"
        
    except Reminder.DoesNotExist:
        logger.error(f"Reminder {reminder_id} not found or inactive")
        return f"Reminder {reminder_id} not found"
    except Exception as exc:
        logger.error(f"Failed to send reminder {reminder_id}: {str(exc)}")
        raise

@shared_task
def check_and_send_reminders():
    """
    Periodic task to check for due reminders and send them.
    Should be scheduled to run every minute or so.
    """
    from note.models import Reminder
    from django.utils import timezone
    from django.db import models
    
    now = timezone.now()
    
    # Only get reminders that:
    # 1. Are active
    # 2. Are scheduled for now or earlier
    # 3. Either have never been sent (last_sent is None) OR
    #    have been sent but are recurring and enough time has passed
    due_reminders = Reminder.objects.filter(
        is_active=True,
        scheduled_time__lte=now
    ).filter(
        models.Q(last_sent__isnull=True) |  # Never sent
        models.Q(
            frequency='once',
            last_sent__isnull=True
        ) |  # One-time reminder not sent yet
        models.Q(
            frequency='daily',
            last_sent__lt=now - timezone.timedelta(days=1)
        ) |  # Daily and last sent more than a day ago
        models.Q(
            frequency='weekly',
            last_sent__lt=now - timezone.timedelta(weeks=1)
        ) |  # Weekly and last sent more than a week ago
        models.Q(
            frequency='monthly',
            last_sent__lt=now - timezone.timedelta(days=30)
        )  # Monthly and last sent more than 30 days ago
    )
    
    count = 0
    for reminder in due_reminders:
        send_reminder_email.delay(reminder.id)
        count += 1
    
    logger.info(f"Scheduled {count} reminder emails")
    return f"Scheduled {count} reminders"
