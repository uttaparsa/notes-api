from django.urls import path

from .views import NoteListView, NoteView, PinMessageView, UnPinMessageView, SingleNoteView, UnArchiveMessageView, \
    ArchiveMessageView, MoveMessageView, SearchResultsView

urlpatterns = [
    path('list/', NoteListView.as_view()),
    path('search/', SearchResultsView.as_view()),
    path('', NoteView.as_view()),
    path('message/<int:note_id>/', SingleNoteView.as_view()),
    path('message/move/<int:note_id>/', MoveMessageView.as_view(), name='move-message'),
    path('message/pin/<int:note_id>/', PinMessageView.as_view(), name='pin-message'),
    path('message/unpin/<int:note_id>/', UnPinMessageView.as_view(), name='unpin-message'),
    path('message/archive/<int:note_id>/', ArchiveMessageView.as_view(), name='archive-message'),
    path('message/unarchive/<int:note_id>/', UnArchiveMessageView.as_view(), name='unarchive-message'),
    path('<slug>/', NoteView.as_view()),


]
