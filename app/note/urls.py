from django.urls import path

from .views import NoteView, NoteListView

urlpatterns = [
    path('', NoteView.as_view()),
    path('list/', NoteListView.as_view()),
]