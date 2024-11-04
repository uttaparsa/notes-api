from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.utils.translation import gettext_lazy as _

from . import serializers


# class SignUpUser(APIView):
#     permission_classes = [AllowAny, ]
#     serializer_class = serializers.UserSignUpRequestSerializer

#     def post(self, request):
#         """
#             This API requests singing up as a user in identity

#             workflow:
#                 1. validate request data
#                 2. check if this email is throttled
#                 3. create a new object and send the token
#                 4. return response
#         """
#         serializer = self.serializer_class(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         validated_data = serializer.validated_data

#         User.objects.create(
#             email=validated_data['email'],
#             password=make_password(validated_data['password'])
#         )

#         return Response({
#             **validated_data,
#             'message': _('signup_successful')
#         }, status=status.HTTP_200_OK)
    
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.contrib.auth import logout
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone



from django.contrib.auth.decorators import login_required

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from .models import UserSession

from django.contrib.sessions.models import Session


from django.middleware.csrf import get_token

@api_view(['GET'])
@permission_classes([AllowAny])
def serve_csrf_cookie(request):
    response = JsonResponse({'details': 'CSRF cookie set'})
    response["X-CSRFToken"] = get_token(request)
    return response


def send_login_notification(self, user, device_name, ip_address):
    subject = "New Login Notification"
    message = (
        f"Hello {user.username},\n\n"
        f"A new login to your account was detected:\n"
        f"Device: {device_name}\n"
        f"IP Address: {ip_address}\n\n"
        f"If this was not you, please take immediate action to secure your account."
    )
    recipient_email = user.email

    send_mail(
        subject,
        message,
        settings.EMAIL_USERNAME,  # Replace with your email
        [recipient_email],
        fail_silently=True,
    )


@authentication_classes([BasicAuthentication]) 
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)

            # Capture device information
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            # get ip behind proxy
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip_address = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

            device_name = request.data.get('device_name', 'Unknown Device')

            # get current session object
            related_session_key = request.session.session_key

            if related_session_key:

                # Store the session
                UserSession.objects.get_or_create(
                    user=user,
                    session_id=related_session_key,
                    device_name=device_name,
                    user_agent=user_agent,
                    ip_address=ip_address,
                    last_activity=timezone.now(),
                )

            # Send login notification email
            if not settings.DEBUG:
                send_login_notification(user, device_name, ip_address)

            return JsonResponse({'message': 'Login successful'})
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=400)


        



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_sessions(request):
    sessions = UserSession.objects.filter(user=request.user).order_by('-last_activity')

    session_data = [
        {
            'session_key': session.session.session_key,
            'device_name': session.device_name,
            'user_agent': session.user_agent,
            'ip_address': session.ip_address,
            'created_at': session.created_at,
            'last_activity': session.last_activity,
        }
        for session in sessions
    ]
    return JsonResponse({'sessions': session_data}, safe=False)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_session(request, session_key):
    try:
        # also delete from db
        Session.objects.get(session_key=session_key).delete()
        
        return JsonResponse({'message': 'Session deleted successfully'})
    except UserSession.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)

from django.contrib.auth.decorators import login_required

@login_required
def check_auth(request):
    return JsonResponse({'authenticated': True})



class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return JsonResponse({'message': 'Logged out successfully'})



class Profile(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=serializers.UserSerializer)
    def get(self, request):
        """
            this API user profile data

            workflow:
                1. check if user is authenticated
                2. returns user profile data
        """
        user = User.objects.get(id=request.user.id)

        serializer = serializers.UserSerializer(
            user
        )
        return Response(
            serializer.data,
            status=status.HTTP_200_OK)


# from rest_framework_simplejwt.views import TokenViewBase
# from .serializers import CustomObtainTokenSerializer


# class CustomTokenObtainPairView(TokenViewBase):
#     serializer_class = CustomObtainTokenSerializer


