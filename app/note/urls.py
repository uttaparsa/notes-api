from django.urls import path

from .views import  NoteListView, ListNoteView

urlpatterns = [
    # path('', NoteView.as_view()),
    path('', ListNoteView.as_view()),
    path('list/', NoteListView.as_view()),
]