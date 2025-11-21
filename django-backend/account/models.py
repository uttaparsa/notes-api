from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone
from datetime import timedelta

class UserSession(models.Model):
    session = models.OneToOneField('sessions.Session', on_delete=models.CASCADE, primary_key=True,default=None)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.device_name} ({self.session_key})"

class EmailConfirmationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='confirmation_token')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_valid(self):
        # Token valid for 24 hours
        return timezone.now() < self.created_at + timedelta(hours=24)
    
    class Meta:
        db_table = 'email_confirmation_tokens'
