from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from rest_framework.permissions import AllowAny
from ..models import LocalMessage, LocalMessageList
from ..serializers import MessageSerializer
from .pagination import DateBasedPagination

class PublicNoteView(GenericAPIView, ListModelMixin):
    permission_classes = [AllowAny]
    pagination_class = DateBasedPagination
    serializer_class = MessageSerializer

    def get_queryset(self):
        public_lst = LocalMessageList.objects.filter(slug='public').first()
        public_lst_id = public_lst.id if public_lst else -1
        return LocalMessage.objects.filter(list=public_lst_id).order_by('-pinned', '-created_at')

    def get(self, request, **kwargs):
        return self.list(request)