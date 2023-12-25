from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomObtainTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # data['profile'] = UserSerializer(self.user).data
        return data


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
