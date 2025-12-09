from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import Reminder, LocalMessage
from ..serializers import ReminderSerializer
import logging

logger = logging.getLogger(__name__)

class ReminderView(APIView):
    """View for creating and listing reminders"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List all reminders for the current user"""
        reminders = Reminder.objects.filter(user=request.user)
        
        # Optional filtering by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            reminders = reminders.filter(is_active=is_active.lower() == 'true')
        
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new reminder"""
        serializer = ReminderSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify user owns the note
            note = LocalMessage.objects.get(
                id=serializer.validated_data['note'].id,
                user=request.user
            )
            
            # Create reminder
            reminder = serializer.save(user=request.user)
            
            logger.info(f"Created reminder {reminder.id} for user {request.user.id}")
            
            return Response(
                ReminderSerializer(reminder).data,
                status=status.HTTP_201_CREATED
            )
            
        except LocalMessage.DoesNotExist:
            return Response(
                {"error": "Note not found or you don't have permission"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error creating reminder: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to create reminder"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SingleReminderView(APIView):
    """View for managing individual reminders"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, reminder_id):
        """Get a single reminder"""
        try:
            reminder = Reminder.objects.get(id=reminder_id, user=request.user)
            serializer = ReminderSerializer(reminder)
            return Response(serializer.data)
        except Reminder.DoesNotExist:
            return Response(
                {"error": "Reminder not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, reminder_id):
        """Update a reminder"""
        try:
            reminder = Reminder.objects.get(id=reminder_id, user=request.user)
            serializer = ReminderSerializer(reminder, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save()
            return Response(serializer.data)
            
        except Reminder.DoesNotExist:
            return Response(
                {"error": "Reminder not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, reminder_id):
        """Delete a reminder"""
        try:
            reminder = Reminder.objects.get(id=reminder_id, user=request.user)
            reminder.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Reminder.DoesNotExist:
            return Response(
                {"error": "Reminder not found"},
                status=status.HTTP_404_NOT_FOUND
            )
