from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.db.models import Q
from ..models import LocalMessage, LocalMessageList
from ..serializers import MessageSerializer, SearchSerializer
from .pagination import DateBasedPagination

class SearchResultsView(GenericAPIView, ListModelMixin):
    permission_classes = [IsAuthenticated]
    pagination_class = DateBasedPagination
    serializer_class = MessageSerializer

    def get_queryset(self):
        query = self.request.GET.get("q", "")
        
        # Handle list_slug parameter - can be single slug or comma-separated slugs
        list_slugs = self.request.GET.get("list_slug", "")

        print(f"list_slugs {list_slugs} query is {query}")
        
        if list_slugs and list_slugs.lower() != 'all':
            # Split the slugs and handle both single and multiple slugs
            slug_list = [slug.strip() for slug in list_slugs.split(',')]
            
            # Get all matching lists
            lists = LocalMessageList.objects.filter(slug__in=slug_list)
            
            if not lists.exists():
                return LocalMessage.objects.none()
            
            # Create a Q object for combining list filters
            list_filter = Q()
            for lst in lists:
                list_filter |= Q(list=lst.id)
            
            # Combine with text search
            return LocalMessage.objects.filter(
                Q(text__icontains=query) & list_filter
            ).order_by('-created_at')
        
        # If no list_slug provided or if it's 'All', search across all lists
        return LocalMessage.objects.filter(
            Q(text__icontains=query)
        ).order_by('-created_at')

    @extend_schema(
        parameters=[SearchSerializer],
        description="""
        Search messages across multiple lists.
        
        Parameters:
        - q: Search query string
        - list_slug: Single list slug or comma-separated list of slugs (e.g., 'list1,list2,list3')
                    Use 'All' or omit to search all lists
        """
    )
    def get(self, request, **kwargs):
        return self.list(request)