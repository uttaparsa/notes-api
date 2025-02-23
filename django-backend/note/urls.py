from django.urls import path

from .views.file_view import FileUploadView, serve_minio_file
from .views.list_view import NoteListView, ArchiveMessageListView, UnArchiveMessageListView
from .views.search_view import SearchResultsView
from .views.note_view import NoteView, SingleNoteView, MoveMessageView, PinMessageView, UnPinMessageView, ArchiveMessageView, UnArchiveMessageView, NoteRevisionView, SimilarNotesView
from .views.public_note_view import PublicNoteView
from .views.stats_view import RevisionStatsView, NoteStatsView, FileAccessStatsView


urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('files/<path:file_path>', serve_minio_file, name='serve_minio_file'),
    path('list/<int:pk>/archive/', ArchiveMessageListView.as_view(), name='archive-list'),
    path('list/<int:pk>/unarchive/', UnArchiveMessageListView.as_view(), name='unarchive-list'),
    path('list/<int:pk>/', NoteListView.as_view(), name='note-list-detail'),
    path('list/', NoteListView.as_view(), name='note-list'),
    path('search/', SearchResultsView.as_view()),
    path('', NoteView.as_view()),
    path('message/<int:note_id>/', SingleNoteView.as_view()),
    path('message/move/<int:note_id>/', MoveMessageView.as_view(), name='move-message'),
    path('message/pin/<int:note_id>/', PinMessageView.as_view(), name='pin-message'),
    path('message/unpin/<int:note_id>/', UnPinMessageView.as_view(), name='unpin-message'),
    path('message/archive/<int:note_id>/', ArchiveMessageView.as_view(), name='archive-message'),
    path('message/unarchive/<int:note_id>/', UnArchiveMessageView.as_view(), name='unarchive-message'),
    path('pp/', PublicNoteView.as_view()),
    path('<slug>/', NoteView.as_view()),
    # In note/urls.py, add:
    path('revisions/<int:note_id>/', NoteRevisionView.as_view(), name='note-revisions'),
    path('message/<int:note_id>/similar/', SimilarNotesView.as_view(), name='similar-notes'),
    path('stats/revisions/', RevisionStatsView.as_view(), name='revision-stats'),
    path('stats/notes/', NoteStatsView.as_view(), name='note-stats'),
    path('stats/file-access/', FileAccessStatsView.as_view(), name='file-access'),


]
