from django.urls import path
from . import views
from . import pfe_views

urlpatterns = [
    path('make_presence/', views.make_presence, name='make presence'),
    path('get_absence_made/', views.get_absence_made, name='get absence made'),
    path('get_current_session/', views.get_current_session, name='get current session'),
    path('get_classes/', views.get_classes, name='get classes'),
    path('pfe/session/state/', pfe_views.get_teacher_pfe_session_state, name='get_teacher_pfe_session_state'),
    path('pfe/session/start/', pfe_views.head_start_pfe_date_collection, name='head_start_pfe_date_collection'),
    path('pfe/session/generate/', pfe_views.head_generate_pfe_schedule, name='head_generate_pfe_schedule'),
    path('pfe/availability/submit/', pfe_views.submit_teacher_pfe_availability, name='submit_teacher_pfe_availability'),
    path('pfe/schedule/', pfe_views.get_my_pfe_schedule, name='get_my_pfe_schedule'),
    
]