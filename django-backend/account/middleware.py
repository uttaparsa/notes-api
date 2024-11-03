from django.utils import timezone
from .models import UserSession

class UpdateLastAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only update if the user has a session
        # session_key = request.session.session_key
        # print(f"session_key is {session_key}")
        # if session_key:
        #     # Update the last accessed time if the session is exists
        #     user_session = UserSession.objects.filter(session_id=session_key).first()
        #     if user_session:
        #         user_session.last_accessed = timezone.now()
        #         user_session.save()



        response = self.get_response(request)
        return response