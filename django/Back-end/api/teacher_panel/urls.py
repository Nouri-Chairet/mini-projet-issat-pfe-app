from django.urls import path
from . import views

urlpatterns = [
    path('make_presence/', views.make_presence, name='make presence'),
    path('get_absence_made/', views.get_absence_made, name='get absence made'),
    path('get_current_session/', views.get_current_session, name='get current session'),
    path('get_classes/', views.get_classes, name='get classes'),
    
]