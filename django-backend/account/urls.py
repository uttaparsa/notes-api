from django.urls import path

from .views import login_view, LogoutView, list_user_sessions, delete_user_session, serve_csrf_cookie, signup_view, confirm_email





urlpatterns = [
    # path('profile/', Profile.as_view()),
    path('csrf/', serve_csrf_cookie, name='csrf'),
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('sessions/', list_user_sessions, name='list_user_sessions'),
    path('sessions/<str:session_key>/', delete_user_session, name='delete_user_session'),
    path('confirm-email/<uuid:token>/', confirm_email, name='confirm_email'),

]

