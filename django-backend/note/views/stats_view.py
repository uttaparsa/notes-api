from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from django.db.models.functions import TruncDate

from ..models import NoteRevision, LocalMessage

from rest_framework.permissions import IsAuthenticated


from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from ..file_utils import file_access_tracker



class StatsManager:
    @staticmethod
    def get_date_range_stats(queryset, date_field, days=7):
        """Generic method to get date-based stats for any queryset"""
        start_date = timezone.now() - timedelta(days=days)
        
        # Get daily counts
        daily_counts = queryset.filter(
            **{f"{date_field}__gte": start_date}
        ).annotate(
            date=TruncDate(date_field)
        ).values(
            'date'
        ).annotate(
            count=Count('id')
        ).order_by('date')
        
        # Create a complete list of dates with counts
        date_counts = {}
        current_date = start_date.date()
        end_date = timezone.now().date()
        
        while current_date <= end_date:
            date_counts[current_date.isoformat()] = 0
            current_date += timedelta(days=1)
            
        # Fill in actual counts
        for entry in daily_counts:
            date_counts[entry['date'].isoformat()] = entry['count']
            
        return [
            {'date': date, 'count': count}
            for date, count in date_counts.items()
        ]
    
class RevisionStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(
            StatsManager.get_date_range_stats(
                NoteRevision.objects.all(),
                'created_at'
            )
        )

class NoteStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(
            StatsManager.get_date_range_stats(
                LocalMessage.objects.all(),
                'created_at'
            )
        )
    

class FileAccessStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True))
    def get(self, request, file_path=None):
        if file_path:
            # Get stats for specific file
            recent_accesses = file_access_tracker.get_recent_accesses(file_path)
            return Response({
                'file_path': file_path,
                'accesses': [
                    {
                        'ip': ip,
                        'last_access': timestamp.isoformat(),
                    }
                    for ip, timestamp in recent_accesses.items()
                ]
            })
        else:
            # Get stats for all files
            all_stats = {}
            for file_path in file_access_tracker.access_log.keys():
                recent_accesses = file_access_tracker.get_recent_accesses(file_path)
                if recent_accesses:  # Only include files with recent accesses
                    all_stats[file_path] = [
                        {
                            'ip': ip,
                            'last_access': timestamp.isoformat(),
                        }
                        for ip, timestamp in recent_accesses.items()
                    ]
            
            return Response(all_stats)