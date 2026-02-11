import re
from collections import Counter

from django.core.cache import cache
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from note.models import LocalMessage, Workspace

HASHTAG_PATTERN = re.compile(r'(?:^|(?<=\s))#(\w+)', re.UNICODE | re.MULTILINE)
CODE_BLOCK_PATTERN = re.compile(r'```.*?```', re.DOTALL)
URL_PATTERN = re.compile(r'https?://\S+')

CACHE_TTL = 600


def extract_hashtags(text):
    if not text:
        return []
    text = CODE_BLOCK_PATTERN.sub('', text)
    text = URL_PATTERN.sub('', text)
    tags = HASHTAG_PATTERN.findall(text)
    return [t.lower() for t in tags]


class TrendingHashtagsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        workspace_slug = request.query_params.get('workspace', '')
        cache_key = f'trending_hashtags:{request.user.id}:{workspace_slug or "all"}'

        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        queryset = LocalMessage.objects.filter(
            user=request.user,
            archived=False,
        )

        if workspace_slug:
            try:
                workspace = Workspace.objects.get(slug=workspace_slug, user=request.user)
                category_ids = workspace.get_visible_categories().values_list('id', flat=True)
                queryset = queryset.filter(list_id__in=category_ids)
            except Workspace.DoesNotExist:
                pass

        texts = queryset.order_by('-created_at').values_list('text', flat=True)[:1000]

        counter = Counter()
        for text in texts:
            counter.update(extract_hashtags(text))

        result = [
            {'tag': tag, 'count': count}
            for tag, count in counter.most_common(10)
        ]

        cache.set(cache_key, result, CACHE_TTL)

        return Response(result)
