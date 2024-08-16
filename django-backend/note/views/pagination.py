from datetime import date

from rest_framework.pagination import  PageNumberPagination
from ..models import LocalMessageList
from django.db.models import Q

class DateBasedPagination(PageNumberPagination):
    page_size = 20  # Adjust as per your requirements

    def get_page_number(self, request, paginator):
        # Retrieve the requested page number based on the date parameter

        if 'date' in request.GET:
            archive_lst = LocalMessageList.objects.filter(slug='archive').first()  # get archive list to ignore it
            archive_lst_id = archive_lst.id if archive_lst else -1
            selected_date = date(*map(int, request.GET.get("date").split('-')))
            print(f"selected date is {selected_date}")
            queryset = paginator.object_list.exclude(list=archive_lst_id).order_by('-pinned', '-created_at')\
                .filter(Q(created_at__gt=selected_date) | Q(pinned=True))
            page_number = queryset.count() // self.page_size + 1
            print(f"page_number is {page_number}, page_size = {self.page_size}")

            return page_number

        return super().get_page_number(request, paginator)
