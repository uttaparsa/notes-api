from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import serializers
from .models import LocalMessage, LocalMessageList


# @extend_schema(parameters=[])
class NoteView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.MessageSerializer

    def get(self, request, format=None):
        local_messages = [msg for msg in LocalMessage.objects.all()]
        serializer = self.serializer_class(local_messages, many=True)
        return Response(serializer.data)



    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NoteListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.NoteListSerializer

    def get(self, request, format=None):
        local_messages = [msg for msg in LocalMessageList.objects.all()]
        serializer = self.serializer_class(local_messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer['list'] = 1
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)