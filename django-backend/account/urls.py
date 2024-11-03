from django.urls import path

from .views import Profile, login_view, LogoutView, list_user_sessions, delete_user_session





urlpatterns = [
    # path('profile/', Profile.as_view()),
    path('login/', login_view, name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('sessions/', list_user_sessions, name='list_user_sessions'),
    path('sessions/<str:session_key>/', delete_user_session, name='delete_user_session'),

]

