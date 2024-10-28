from django.utils import timezone
from .models import UserSession

class UpdateLastAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only update if the user has a session
        session_key = request.session.session_key
        if session_key:
            # Get or create a SessionAccess object for this session key
            session_access, created = UserSession.objects.get_or_create(session=session_key)
            # Update the last accessed time
            session_access.last_activity = timezone.now()
            session_access.save()

        response = self.get_response(request)
        return response