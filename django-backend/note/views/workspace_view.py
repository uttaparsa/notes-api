from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Workspace, LocalMessageList
from ..serializers import WorkspaceSerializer, NoteListSerializer


class WorkspaceListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get(self, request, format=None):
        workspaces = Workspace.objects.filter(user=request.user)
        serializer = self.serializer_class(workspaces, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkspaceDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get(self, request, pk):
        try:
            workspace = Workspace.objects.get(pk=pk, user=request.user)
            serializer = self.serializer_class(workspace)
            return Response(serializer.data)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            workspace = Workspace.objects.get(pk=pk, user=request.user)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.serializer_class(workspace, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            workspace = Workspace.objects.get(pk=pk, user=request.user)
            workspace.delete()
            return Response({"message": "Workspace deleted successfully"}, status=status.HTTP_200_OK)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)


class WorkspaceCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            workspace = Workspace.objects.get(pk=pk, user=request.user)
            categories = workspace.get_visible_categories()
            serializer = NoteListSerializer(categories, many=True)
            return Response(serializer.data)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        try:
            workspace = Workspace.objects.get(pk=pk, user=request.user)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        category_ids = request.data.get('category_ids', [])
        if not category_ids:
            return Response({"error": "category_ids is required"}, status=status.HTTP_400_BAD_REQUEST)

        categories = LocalMessageList.objects.filter(id__in=category_ids, user=request.user)
        workspace.categories.add(*categories)
        return Response({"message": "Categories added to workspace"}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            workspace = Workspace.objects.get(pk=pk, user=request.user)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        category_ids = request.data.get('category_ids', [])
        if not category_ids:
            return Response({"error": "category_ids is required"}, status=status.HTTP_400_BAD_REQUEST)

        categories = LocalMessageList.objects.filter(id__in=category_ids, user=request.user)
        workspace.categories.remove(*categories)
        return Response({"message": "Categories removed from workspace"}, status=status.HTTP_200_OK)


class DefaultWorkspaceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            workspace = Workspace.objects.get(user=request.user, is_default=True)
            serializer = WorkspaceSerializer(workspace)
            return Response(serializer.data)
        except Workspace.DoesNotExist:
            return Response({"error": "Default workspace not found"}, status=status.HTTP_404_NOT_FOUND)