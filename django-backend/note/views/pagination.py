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
            
            object_list = paginator.object_list
            
            if isinstance(object_list, list):
                notes_before = [item for item in object_list if item.created_at.date() > selected_date]
                page_number = len(notes_before) // self.page_size + 1
                
                first_item_on_date = next(
                    (item for item in object_list if item.created_at.date() == selected_date),
                    None
                )
                if first_item_on_date:
                    request._highlight_note_id = first_item_on_date.id
            else:
                queryset = object_list.order_by('-created_at')
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
