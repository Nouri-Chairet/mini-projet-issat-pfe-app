from django.urls import path
from . import views
from . import pfe_views
from . import presence_views
from . import pfe_management_views

urlpatterns = [
    path('make_presence/', views.make_presence, name='make presence'),
    path('get_absence_made/', views.get_absence_made, name='get absence made'),
    path('get_current_session/', views.get_current_session, name='get current session'),
    path('get_classes/', views.get_classes, name='get classes'),
    # --- Presence tracking (new) ---
    path('presence/today-classes/', presence_views.get_today_classes, name='presence_today_classes'),
    path('presence/students/', presence_views.get_presence_students, name='presence_students'),
    path('presence/history/', presence_views.get_class_presence_history, name='presence_history'),
    # --- PFE single-upload (new) ---
    path('pfe/eligible-students/', pfe_management_views.list_eligible_students, name='pfe_eligible_students'),
    path('pfe/subjects/', pfe_management_views.list_my_supervised_subjects, name='teacher_list_pfe_subjects'),
    path('pfe/subjects/create/', pfe_management_views.create_pfe_subject, name='teacher_create_pfe_subject'),
    path('posts/', views.get_teacher_posts, name='get_teacher_posts'),
    path('forum/create/', views.create_teacher_forum_question, name='create_teacher_forum_question'),
    path('pfe/session/state/', pfe_views.get_teacher_pfe_session_state, name='get_teacher_pfe_session_state'),
    path('pfe/session/start/', pfe_views.head_start_pfe_date_collection, name='head_start_pfe_date_collection'),
    path('pfe/session/generate/', pfe_views.head_generate_pfe_schedule, name='head_generate_pfe_schedule'),
    path('pfe/availability/submit/', pfe_views.submit_teacher_pfe_availability, name='submit_teacher_pfe_availability'),
    path('pfe/schedule/', pfe_views.get_my_pfe_schedule, name='get_my_pfe_schedule'),
    
]
