from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from django.db.models.functions import TruncDate

from ..models import NoteRevision

class RevisionStatsView(APIView):
    def get(self, request):
        # Get the date 7 days ago
        seven_days_ago = timezone.now() - timedelta(days=7)
        
        # Get daily revision counts for the last 7 days
        daily_revisions = NoteRevision.objects.filter(
            created_at__gte=seven_days_ago
        ).annotate(
            date=TruncDate('created_at')
        ).values(
            'date'
        ).annotate(
            count=Count('id')
        ).order_by('date')
        
        # Create a complete list of dates with counts
        date_counts = {}
        current_date = seven_days_ago.date()
        end_date = timezone.now().date()
        
        while current_date <= end_date:
            date_counts[current_date.isoformat()] = 0
            current_date += timedelta(days=1)
            
        # Fill in actual counts
        for entry in daily_revisions:
            date_counts[entry['date'].isoformat()] = entry['count']
        
        # Convert to list of dictionaries for the frontend
        result = [
            {'date': date, 'count': count}
            for date, count in date_counts.items()
        ]
        
        return Response(result)