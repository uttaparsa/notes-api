from datetime import date

from rest_framework.pagination import  PageNumberPagination
from ..models import LocalMessageList
from django.db.models import Q

class DateBasedPagination(PageNumberPagination):
    page_size = 20  # Adjust as per your requirements

    def get_page_number(self, request, paginator):
        # Retrieve the requested page number based on the date parameter

        if 'date' in request.GET:
            archived_lists = LocalMessageList.objects.filter(archived=True)  # get archive list to ignore it
            selected_date = date(*map(int, request.GET.get("date").split('-')))
            print(f"selected date is {selected_date}")
            queryset = paginator.object_list.exclude(list__in=archived_lists).order_by('-importance', '-created_at')\
                .filter(Q(created_at__gt=selected_date) | Q(importance__gt=1))
            page_number = queryset.count() // self.page_size + 1
            print(f"page_number is {page_number}, page_size = {self.page_size}")

            return page_number

        return super().get_page_number(request, paginator)
