from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import LocalMessageList, LocalMessage
from ..serializers import NoteListSerializer

class NoteListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NoteListSerializer

    def get(self, request, format=None):
        local_messages = LocalMessageList.objects.filter(user=request.user)
        serializer = self.serializer_class(local_messages, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            note_list = LocalMessageList.objects.get(pk=pk, user=request.user)
        except LocalMessageList.DoesNotExist:
            return Response({"error": "LocalMessageList not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.serializer_class(note_list, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ArchiveMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            item = LocalMessageList.objects.get(pk=pk, user=request.user)
            item.archived = True
            item.save()
            return Response("1", status=status.HTTP_200_OK)
        except LocalMessageList.DoesNotExist:
            return Response({"error": "LocalMessageList not found"}, status=status.HTTP_404_NOT_FOUND)

class UnArchiveMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            item = LocalMessageList.objects.get(pk=pk, user=request.user)
            item.archived = False
            item.save()
            return Response("1", status=status.HTTP_200_OK)
        except LocalMessageList.DoesNotExist:
            return Response({"error": "LocalMessageList not found"}, status=status.HTTP_404_NOT_FOUND)

class DeleteMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            item = LocalMessageList.objects.get(pk=pk, user=request.user)
            
            # Check if the list has any messages
            message_count = LocalMessage.objects.filter(list=item).count()
            if message_count > 0:
                return Response(
                    {"error": f"Cannot delete list with {message_count} message(s). Please move or delete all messages first."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            item.delete()
            return Response({"message": "List deleted successfully"}, status=status.HTTP_200_OK)
        except LocalMessageList.DoesNotExist:
            return Response({"error": "LocalMessageList not found"}, status=status.HTTP_404_NOT_FOUND)