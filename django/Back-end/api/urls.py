from django.urls import path, include

urlpatterns = [
    path('auth/', include('api.auth.urls')),
    path('admin/', include('api.admin_panel.urls')),
    path('teacher/', include('api.teacher_panel.urls')),
    path('student/', include('api.student_panel.urls')),

]
