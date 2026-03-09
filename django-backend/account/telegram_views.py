import json
import logging
import requests as http_requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import UserProfile

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def telegram_webhook(request):
    secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token', '')

    try:
        profile = UserProfile.objects.get(telegram_webhook_secret=secret)
    except UserProfile.DoesNotExist:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    callback_query = body.get('callback_query')
    if callback_query:
        callback_query_id = callback_query['id']
        data = callback_query.get('data', '')
        message = callback_query.get('message', {})
        chat_id = message.get('chat', {}).get('id')
        message_id = message.get('message_id')
        _handle_callback(profile, callback_query_id, data, chat_id, message_id)

    return JsonResponse({'ok': True})


def _handle_callback(profile, callback_query_id, data, chat_id, message_id):
    from note.models import TelegramReminderMessage, Reminder
    from django.utils import timezone
    from datetime import timedelta

    token = profile.telegram_bot_token
    base_url = f"https://api.telegram.org/bot{token}"

    try:
        if data.startswith('snooze_'):
            parts = data.split('_')
            minutes = int(parts[1])
            reminder_id = int(parts[2])

            try:
                reminder = Reminder.objects.get(id=reminder_id, user=profile.user)
            except Reminder.DoesNotExist:
                _answer_callback(base_url, callback_query_id, 'Reminder not found.')
                return

            reminder.snoozed_until = timezone.now() + timedelta(minutes=minutes)
            reminder.is_active = True
            reminder.save()

            label_map = {15: '15 minutes', 60: '1 hour', 240: '4 hours', 1440: 'tomorrow'}
            label = label_map.get(minutes, f'{minutes} minutes')
            _answer_callback(base_url, callback_query_id, f'Snoozed for {label}.')
            _clear_inline_keyboard(base_url, chat_id, message_id)

        elif data.startswith('dismiss_'):
            reminder_id = int(data.split('_')[1])

            try:
                reminder = Reminder.objects.get(id=reminder_id, user=profile.user)
            except Reminder.DoesNotExist:
                _answer_callback(base_url, callback_query_id, 'Reminder not found.')
                return

            reminder.is_active = False
            reminder.snoozed_until = None
            reminder.save()

            tg_messages = TelegramReminderMessage.objects.filter(reminder=reminder)
            for tg_msg in tg_messages:
                http_requests.post(
                    f"{base_url}/deleteMessage",
                    json={'chat_id': profile.telegram_chat_id, 'message_id': tg_msg.message_id},
                    timeout=10,
                )
            tg_messages.delete()

            _answer_callback(base_url, callback_query_id, 'Reminder dismissed.')

    except Exception as exc:
        logger.error(f"Telegram callback error: {exc}")
        _answer_callback(base_url, callback_query_id, 'An error occurred.')


def _answer_callback(base_url, callback_query_id, text):
    try:
        http_requests.post(
            f"{base_url}/answerCallbackQuery",
            json={'callback_query_id': callback_query_id, 'text': text},
            timeout=10,
        )
    except Exception as exc:
        logger.error(f"answerCallbackQuery failed: {exc}")


def _clear_inline_keyboard(base_url, chat_id, message_id):
    try:
        http_requests.post(
            f"{base_url}/editMessageReplyMarkup",
            json={
                'chat_id': chat_id,
                'message_id': message_id,
                'reply_markup': {'inline_keyboard': []},
            },
            timeout=10,
        )
    except Exception as exc:
        logger.error(f"editMessageReplyMarkup failed: {exc}")
