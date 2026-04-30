import re

with open('/home/nouri/mini-projet-issat-pfe-app/django/Back-end/api/admin_panel/views.py', 'r') as f:
    content = f.read()

# Replace IsAdmin with nothing in permission_classes
new_content = re.sub(
    r"@permission_classes\(\[IsAuthenticated, IsAdmin\]\)\ndef list_department_announcements",
    r"@permission_classes([IsAuthenticated])\ndef list_department_announcements",
    content
)

# Modify the queryset to handle roles and global announcements
replacement_code = """def list_department_announcements(request):
    \"\"\"List all department announcements, optionally filtered by department. Also includes global announcements.\"\"\"
    try:
        from django.db.models import Q
        from api.models import UserRole, Teachers

        department_id = request.query_params.get('department_id')
        
        # Base query: Announcements have type='announcement' (implied by create logic, but we'll use department/global logic)
        qs = Posts.objects.select_related('author', 'department').order_by('-created_at')
        
        if request.user.role == UserRole.ADMIN.value:
            qs = qs.filter(Q(department__isnull=False) | Q(department__isnull=True, class_id__isnull=True))
            if department_id:
                qs = qs.filter(department_id=department_id)
        elif request.user.role == UserRole.TEACHER.value:
            teacher = Teachers.objects.filter(user=request.user).first()
            if teacher and teacher.department:
                qs = qs.filter(Q(department__name=teacher.department) | Q(department__isnull=True, class_id__isnull=True))
            else:
                qs = qs.filter(department__isnull=True, class_id__isnull=True)
        else:
            # Students only see global announcements here (or their class specific ones, but those are handled elsewhere)
            qs = qs.filter(department__isnull=True, class_id__isnull=True)

        return Response(
            {
                "announcements": [
                    {
                        "id": str(p.id),
                        "title": p.title,
                        "content": p.content,
                        "department_id": str(p.department_id) if p.department_id else None,
                        "department_name": p.department.name if p.department else "Global",
                        "author": p.author.username,
                        "created_at": str(p.created_at),
                    }
                    for p in qs
                ]
            },
            status=200,
        )"""

# We need to find the function and replace it
import ast
# simpler replacement:
start_str = "def list_department_announcements(request):"
end_str = "except Exception as exc:\n        return Response({\"error\": str(exc)}, status=500)"

start_idx = new_content.find(start_str)
end_idx = new_content.find(end_str, start_idx) + len(end_str)

new_content = new_content[:start_idx] + replacement_code + "\n    " + end_str + new_content[end_idx:]

with open('/home/nouri/mini-projet-issat-pfe-app/django/Back-end/api/admin_panel/views.py', 'w') as f:
    f.write(new_content)
