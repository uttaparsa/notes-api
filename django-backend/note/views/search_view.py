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
        if 'list_slug' in self.request.GET:
            list_slug = self.request.GET.get("list_slug")
            lst = LocalMessageList.objects.get(slug=list_slug)
            return LocalMessage.objects.filter(
                Q(text__icontains=query) & Q(list=lst.id)
            ).order_by('-created_at')
        else:
            return LocalMessage.objects.filter(
                Q(text__icontains=query)
            ).order_by('-created_at')

    @extend_schema(parameters=[SearchSerializer])
    def get(self, request, **kwargs):
        return self.list(request)