from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.db.models import Q
from ..models import LocalMessage, LocalMessageList, Workspace
from ..serializers import MessageSerializer, SearchSerializer
from .pagination import DateBasedPagination

class SearchResultsView(GenericAPIView, ListModelMixin):
    permission_classes = [IsAuthenticated]
    pagination_class = DateBasedPagination
    serializer_class = MessageSerializer

    def get_queryset(self):
        query = self.request.GET.get("q", "")
        list_slugs = self.request.GET.get("list_slug", "")
        workspace_slug = self.request.GET.get("workspace", "")
        show_hidden = self.request.GET.get('show_hidden', 'false').lower() == 'true'
        has_files = self.request.GET.get('has_files', 'false').lower() == 'true'

        print(f"list_slugs {list_slugs} query is {query}")
        
        queryset = LocalMessage.objects.filter(user=self.request.user)
        if not show_hidden:
            queryset = queryset.filter(archived=False)
        
        if has_files:
            queryset = queryset.filter(files__isnull=False).distinct()
        
        # Get workspace if specified
        workspace = None
        if workspace_slug:
            try:
                workspace = Workspace.objects.get(slug=workspace_slug, user=self.request.user)
            except Workspace.DoesNotExist:
                return LocalMessage.objects.none()
        
        if query:
            # Handle both 'and' and 'or' conditions
            if ' and ' in query:
                search_terms = query.split(' and ')
                text_filter = Q()
                for term in search_terms:
                    text_filter &= Q(text__icontains=term.strip())
            elif ' or ' in query:
                search_terms = query.split(' or ')
                text_filter = Q()
                for term in search_terms:
                    text_filter |= Q(text__icontains=term.strip())
            else:
                # Single term search
                text_filter = Q(text__icontains=query.strip())
            
            queryset = queryset.filter(text_filter)
        
        if list_slugs and list_slugs.lower() != 'all':
            slug_list = [slug.strip() for slug in list_slugs.split(',')]
            lists = LocalMessageList.objects.filter(slug__in=slug_list, user=self.request.user)
            
            if not lists.exists():
                return LocalMessage.objects.none()
            
            # Filter lists by workspace visibility
            if workspace:
                visible_lists = workspace.get_visible_categories()
                lists = lists.filter(id__in=visible_lists.values_list('id', flat=True))
                if not lists.exists():
                    return LocalMessage.objects.none()
            
            list_filter = Q()
            for lst in lists:
                list_filter |= Q(list=lst.id)
            
            queryset = queryset.filter(list_filter)
        elif workspace:
            # If workspace is specified but no specific lists, filter by workspace's visible categories
            visible_list_ids = workspace.get_visible_categories().values_list('id', flat=True)
            queryset = queryset.filter(list__in=visible_list_ids)
        
        return queryset.order_by('-created_at')

    @extend_schema(
        parameters=[SearchSerializer],
        description="""
        Search messages across multiple lists.
        
        Parameters:
        - q: Search query string (supports 'and'/'or' operators, e.g., 'term1 and term2' or 'term1 or term2')
        - list_slug: Single list slug or comma-separated list of slugs (e.g., 'list1,list2,list3')
                    Use 'All' or omit to search all lists
        - workspace: Workspace slug to filter search results
        - has_files: Only return messages that contain files (true/false)
        """
    )
    def get(self, request, **kwargs):
        return self.list(request)