from django.utils import timezone
from .models import UserSession
import asyncio

from asgiref.sync import iscoroutinefunction, markcoroutinefunction

class UpdateLastAccessMiddleware:

    async_capable = True
    sync_capable = True


    def __init__(self, get_response):
        self.get_response = get_response
        if iscoroutinefunction(self.get_response):
            markcoroutinefunction(self)


    async def __call__(self, request):
        session_key = request.session.session_key

        # Non-blocking database update
        if session_key:

            self.update_last_access(session_key)
            

        response =  await self.get_response(request)
        return response

    async def update_last_access(self, session_key):
        
        user_session = await UserSession.objects.filter(session_id=session_key).afirst()
        if user_session:
            # print(f"Updating last access time for {user_session.user}")
            user_session.last_accessed = timezone.now()
            await user_session.asave()
    
