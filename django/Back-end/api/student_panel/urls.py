from django.urls import path

from . import views


urlpatterns = [
    path("notifications/", views.get_student_notifications, name="get_student_notifications"),
    path("notifications/mark-read/", views.mark_student_notification_read, name="mark_student_notification_read"),
    path("pfe/overview/", views.get_student_pfe_overview, name="get_student_pfe_overview"),
    path("classmates/", views.get_student_classmates, name="get_student_classmates"),
    path("posts/", views.get_student_posts, name="get_student_posts"),
]
