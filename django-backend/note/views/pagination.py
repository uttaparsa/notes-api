from datetime import date
from django.conf import settings
from rest_framework.pagination import PageNumberPagination
from ..models import LocalMessageList
from django.db.models import Q


class DateBasedPagination(PageNumberPagination):
    page_size = settings.NOTES_PAGE_SIZE

    def get_page_number(self, request, paginator):
        if 'date' in request.GET:
            selected_date = date(*map(int, request.GET.get("date").split('-')))
            
            # Get the slug from the request to determine if we're viewing a specific list
            slug = request.resolver_match.kwargs.get('slug') if hasattr(request, 'resolver_match') else None
            
            # Only exclude archived lists if we're viewing "All" or no specific slug
            queryset = paginator.object_list.order_by('-created_at')
            if not slug or slug == "All":
                archived_lists = LocalMessageList.objects.filter(archived=True, user=request.user)
                queryset = queryset.exclude(list__in=archived_lists)
            
            notes_before = queryset.filter(created_at__gt=selected_date)
            page_number = notes_before.count() // self.page_size + 1
            
            first_note_on_date = queryset.filter(created_at__date=selected_date).order_by('-created_at').first()
            if first_note_on_date:
                request._highlight_note_id = first_note_on_date.id
            
            return page_number
        return super().get_page_number(request, paginator)

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        if hasattr(self.request, '_highlight_note_id'):
            response.data['highlight_note_id'] = self.request._highlight_note_id
        return response
