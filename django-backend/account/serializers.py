from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile




class UserSignUpRequestSerializer(serializers.ModelSerializer):
    message = serializers.CharField(max_length=256, read_only=True)

    class Meta:
        model = User
        fields = (
            'email',
            'message',
            'password'
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'password',
            'is_active',
        )
        extra_kwargs = {
            'password': {'write_only': True},
        }

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('notification_channel', 'telegram_bot_token', 'telegram_chat_id')