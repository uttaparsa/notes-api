from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.utils.translation import gettext_lazy as _

from . import serializers


class SignUpUser(APIView):
    permission_classes = [AllowAny, ]
    serializer_class = serializers.UserSignUpRequestSerializer

    def post(self, request):
        """
            This API requests singing up as a user in identity

            workflow:
                1. validate request data
                2. check if this email is throttled
                3. create a new object and send the token
                4. return response
        """
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        User.objects.create(
            email=validated_data['email'],
            password=make_password(validated_data['password'])
        )

        return Response({
            **validated_data,
            'message': _('signup_successful')
        }, status=status.HTTP_200_OK)


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


from rest_framework_simplejwt.views import TokenViewBase
from .serializers import CustomObtainTokenSerializer


class CustomTokenObtainPairView(TokenViewBase):
    serializer_class = CustomObtainTokenSerializer
