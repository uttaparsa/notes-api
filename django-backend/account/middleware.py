from asgiref.sync import sync_to_async
from django.utils import timezone
from .models import UserSession  # Ensure you have the correct path to your UserSession model

class UpdateLastAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    async def __call__(self, request):
        # Only update if the user has a session
        session_key = request.session.session_key
        if session_key:
            # Get or create a SessionAccess object for this session key asynchronously
            session_access, created = await sync_to_async(UserSession.objects.get_or_create)(session=session_key)
            # Update the last accessed time
            session_access.last_activity = timezone.now()
            # Save asynchronously
            await sync_to_async(session_access.save)()

        response = await sync_to_async(self.get_response)(request)
        return response
