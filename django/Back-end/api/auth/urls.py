from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('update-pass/',views.update_password, name='update_password'),
    path('update-account/', views.update_account, name='update_account'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('forget-password/confirme/', views.reset_password_verify, name='reset_password'),
    path('forget_password/reset/',views.reset_password, name='reset_password'),
    path('refresh/',views.refresh_token, name='refresh_token'),
    path('user/student/', views.get_student, name='get_student'),
    path('user/teacher/', views.get_teacher, name='get_teacher'),
]