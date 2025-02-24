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

from django.conf import settings

import pytz

class StatsManager:
    @staticmethod
    def get_date_range_stats(queryset, date_field, days=7):
        """Generic method to get date-based stats for any queryset in local timezone"""
        # Get the local timezone
        local_tz = pytz.timezone(settings.TIME_ZONE)
        
        # Get current time in local timezone
        local_now = timezone.localtime(timezone.now(), local_tz)
        start_date = local_now - timedelta(days=days)
        
        # Get daily counts with timezone conversion
        daily_counts = queryset.filter(
            **{f"{date_field}__gte": start_date}
        ).annotate(
            # Convert UTC to local time before truncating to date
            date=TruncDate(f"{date_field}",
                          tzinfo=local_tz)
        ).values(
            'date'
        ).annotate(
            count=Count('id')
        ).order_by('date')

        # Create a complete list of dates with counts
        date_counts = {}
        current_date = start_date.date()
        end_date = local_now.date()
        
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
    """
    API view to retrieve file access statistics.
    
    Endpoints:
    - GET /api/note/stats/access/ - Get overall stats grouped by IP
    - GET /api/note/stats/access/?ip=192.168.1.1 - Get files accessed by specific IP
    - GET /api/note/stats/access/?file=image.jpg - Get IPs that accessed a specific file
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True))
    def get(self, request, format=None):
        # Get query parameters
        ip_filter = request.query_params.get('ip', None)
        file_filter = request.query_params.get('file', None)
        limit = int(request.query_params.get('limit', 50))
        
        if ip_filter:
            # Get accesses for a specific IP
            if ip_filter in file_access_tracker.ip_access_log:
                files_accessed = file_access_tracker.ip_access_log[ip_filter]
                
                # Filter by file if specified
                if file_filter:
                    files_accessed = {
                        path: timestamp 
                        for path, timestamp in files_accessed.items()
                        if file_filter in path
                    }
                
                # Format response
                file_list = [
                    {
                        'file_path': path,
                        'last_access': timestamp.isoformat(),
                    }
                    for path, timestamp in sorted(
                        files_accessed.items(), 
                        key=lambda x: x[1], 
                        reverse=True
                    )
                    if timezone.now() - timestamp <= file_access_tracker.max_age
                ]
                
                return Response({
                    'ip': ip_filter,
                    'accessed_files': file_list
                })
            else:
                return Response({
                    'ip': ip_filter,
                    'accessed_files': []
                })
        
        elif file_filter:
            # Get IPs that accessed a specific file
            recent_accesses = file_access_tracker.get_recent_file_accesses(file_filter)
            
            # Format response
            ip_list = [
                {
                    'ip': ip,
                    'last_access': timestamp.isoformat(),
                }
                for ip, timestamp in sorted(recent_accesses.items(), key=lambda x: x[1], reverse=True)
            ]
            
            return Response({
                'file_path': file_filter,
                'accessing_ips': ip_list
            })
        
        else:
            # Get overall stats grouped by IP
            recent_ips = file_access_tracker.get_recent_ip_accesses(limit=limit)
            
            # Format for API response
            result = []
            for ip, data in recent_ips.items():
                result.append({
                    'ip': ip,
                    'last_access': data['last_access'].isoformat(),
                    'files': data['files']
                })
            
            return Response({
                'recent_accesses': result,
                'total_ips': len(result)
            })