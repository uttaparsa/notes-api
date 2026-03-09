from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging
import requests as http_requests

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
        note_url = f"{settings.WEBSITE_URL}{reminder.get_note_url()}"
        
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
        
        reminder.last_sent = timezone.now()
        reminder.snoozed_until = None

        if reminder.frequency != 'once':
            if reminder.frequency == 'daily':
                reminder.scheduled_time = reminder.scheduled_time + timedelta(days=1)
            elif reminder.frequency == 'weekly':
                reminder.scheduled_time = reminder.scheduled_time + timedelta(weeks=1)
            elif reminder.frequency == 'monthly':
                reminder.scheduled_time = reminder.scheduled_time + timedelta(days=30)
        else:
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
def send_reminder_telegram(reminder_id):
    from note.models import Reminder, TelegramReminderMessage
    from django.utils import timezone
    from datetime import timedelta

    try:
        reminder = Reminder.objects.get(id=reminder_id, is_active=True)
        profile = reminder.user.profile

        token = profile.telegram_bot_token
        chat_id = profile.telegram_chat_id

        if not token or not chat_id:
            logger.error(f"Telegram not configured for user {reminder.user.id}")
            return

        highlighted_text = reminder.get_highlighted_text()
        note_url = f"{settings.WEBSITE_URL}{reminder.get_note_url()}"
        title = reminder.description or 'Note Reminder'
        text_preview = highlighted_text[:200] + ('...' if len(highlighted_text) > 200 else '')

        message_text = (
            f"*{title}*\n\n"
            f"{text_preview}\n\n"
            f"[View Note]({note_url})"
        )

        keyboard = {
            'inline_keyboard': [
                [
                    {'text': '⏰ 15m', 'callback_data': f'snooze_15_{reminder.id}'},
                    {'text': '⏰ 1h', 'callback_data': f'snooze_60_{reminder.id}'},
                    {'text': '⏰ 4h', 'callback_data': f'snooze_240_{reminder.id}'},
                    {'text': '⏰ Tomorrow', 'callback_data': f'snooze_1440_{reminder.id}'},
                ],
                [
                    {'text': '✅ Dismiss', 'callback_data': f'dismiss_{reminder.id}'},
                ],
            ]
        }

        resp = http_requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={
                'chat_id': chat_id,
                'text': message_text,
                'parse_mode': 'Markdown',
                'reply_markup': keyboard,
            },
            timeout=10,
        )

        resp_data = resp.json()
        if resp_data.get('ok'):
            msg_id = resp_data['result']['message_id']
            TelegramReminderMessage.objects.create(reminder=reminder, message_id=msg_id)
        else:
            logger.error(f"Telegram sendMessage failed: {resp.text}")
            return

        reminder.last_sent = timezone.now()
        reminder.snoozed_until = None

        if reminder.frequency != 'once':
            if reminder.frequency == 'daily':
                reminder.scheduled_time = reminder.scheduled_time + timedelta(days=1)
            elif reminder.frequency == 'weekly':
                reminder.scheduled_time = reminder.scheduled_time + timedelta(weeks=1)
            elif reminder.frequency == 'monthly':
                reminder.scheduled_time = reminder.scheduled_time + timedelta(days=30)
        else:
            reminder.is_active = False

        reminder.save()

        logger.info(f"Telegram reminder {reminder_id} sent to chat {chat_id}")
        return f"Telegram reminder sent to {chat_id}"

    except Reminder.DoesNotExist:
        logger.error(f"Reminder {reminder_id} not found or inactive")
    except Exception as exc:
        logger.error(f"Failed to send Telegram reminder {reminder_id}: {exc}")
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
    snoozed_due = models.Q(snoozed_until__isnull=False, snoozed_until__lte=now)

    normal_due = (
        models.Q(snoozed_until__isnull=True) &
        models.Q(scheduled_time__lte=now) &
        (
            models.Q(last_sent__isnull=True) |
            models.Q(frequency='daily', last_sent__lt=now - timezone.timedelta(days=1)) |
            models.Q(frequency='weekly', last_sent__lt=now - timezone.timedelta(weeks=1)) |
            models.Q(frequency='monthly', last_sent__lt=now - timezone.timedelta(days=30))
        )
    )

    due_reminders = Reminder.objects.filter(is_active=True).filter(snoozed_due | normal_due)
    
    count = 0
    for reminder in due_reminders:
        try:
            profile = reminder.user.profile
            if (
                profile.notification_channel == 'telegram'
                and profile.telegram_bot_token
                and profile.telegram_chat_id
            ):
                send_reminder_telegram.delay(reminder.id)
            else:
                send_reminder_email.delay(reminder.id)
        except Exception:
            send_reminder_email.delay(reminder.id)
        count += 1

    logger.info(f"Scheduled {count} reminder emails")
    return f"Scheduled {count} reminders"
