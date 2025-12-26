from django.urls import path

from .views.file_view import FileUploadView, serve_minio_file
from .views.list_view import NoteListView, ArchiveMessageListView, UnArchiveMessageListView, DeleteMessageListView
from .views.search_view import SearchResultsView
from .views.note_view import NoteView, SingleNoteView, MoveMessageView, PinMessageView, UnPinMessageView, ArchiveMessageView, UnArchiveMessageView, NoteRevisionView, NoteChunksView, PinnedNotesView, NotePageView
from .views.public_note_view import PublicNoteView
from .views.stats_view import RevisionStatsView, NoteStatsView, FileAccessStatsView
from .views.similar_note_view import SimilarNotesView
from .views.reminder_view import ReminderView, SingleReminderView


urlpatterns = [
        
    # Reminder endpoints
    path('reminders/', ReminderView.as_view(), name='reminders'),
    path('reminders/<int:reminder_id>/', SingleReminderView.as_view(), name='reminder-detail'),
    
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('files/<path:file_path>', serve_minio_file, name='serve_minio_file'),
    path('list/<int:pk>/archive/', ArchiveMessageListView.as_view(), name='archive-list'),
    path('list/<int:pk>/unarchive/', UnArchiveMessageListView.as_view(), name='unarchive-list'),
    path('list/<int:pk>/delete/', DeleteMessageListView.as_view(), name='delete-list'),
    path('list/<int:pk>/', NoteListView.as_view(), name='note-list-detail'),
    path('list/', NoteListView.as_view(), name='note-list'),
    path('search/', SearchResultsView.as_view()),
    
    # Pinned notes endpoints (must be before the slug catch-all)
    path('pinned/', PinnedNotesView.as_view(), name='pinned-notes'),
    path('pinned/<slug>/', PinnedNotesView.as_view(), name='pinned-notes-by-list'),
    
    path('', NoteView.as_view()),

    path('message/<int:note_id>/similar/', SimilarNotesView.as_view(), name='similar-notes'),
    path('similar/', SimilarNotesView.as_view(), name='similar-text'),

    path('message/<int:note_id>/chunks/', NoteChunksView.as_view(), name='note-chunks'),
    path('message/<int:note_id>/page/', NotePageView.as_view(), name='note-page'),

    path('message/<int:note_id>/', SingleNoteView.as_view()),
    path('message/move/<int:note_id>/', MoveMessageView.as_view(), name='move-message'),
    path('message/pin/<int:note_id>/', PinMessageView.as_view(), name='pin-message'),
    path('message/unpin/<int:note_id>/', UnPinMessageView.as_view(), name='unpin-message'),
    path('message/archive/<int:note_id>/', ArchiveMessageView.as_view(), name='archive-message'),
    path('message/unarchive/<int:note_id>/', UnArchiveMessageView.as_view(), name='unarchive-message'),
    path('pp/', PublicNoteView.as_view()),
    path('<slug>/', NoteView.as_view()),
    path('revisions/<int:note_id>/', NoteRevisionView.as_view(), name='note-revisions'),
    path('stats/revisions/', RevisionStatsView.as_view(), name='revision-stats'),
    path('stats/notes/', NoteStatsView.as_view(), name='note-stats'),
    path('stats/access/', FileAccessStatsView.as_view(), name='file-access'),

]
