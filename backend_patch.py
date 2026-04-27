import re

def fix_split_logic_in_views():
    filepath = "django/Back-end/api/admin_panel/views.py"
    with open(filepath, "r") as f:
        content = f.read()

    # Make the teacher lookup robust and fix class error strings
    old_code = """            professeur = row['professeur']
            classe = row['classe']
            professeur_user = Users.objects.filter(username=professeur,role="teacher").first()
            professeur = Teachers.objects.filter(user=professeur_user).first()
            if not professeur:
                return Response({"error": f"Teacher {professeur} not found at row number {index}"}, status=404)"""
    new_code = """            professeur_name = row['professeur']
            classe = row['classe']
            # Search by name instead of just username to be more robust
            professeur_user = Users.objects.filter(username__icontains=professeur_name).first()
            professeur = Teachers.objects.filter(user=professeur_user).first()
            if not professeur:
                return Response({"error": f"Teacher '{professeur_name}' not found at row number {index}"}, status=404)"""

    content = content.replace(old_code, new_code)
    
    with open(filepath, "w") as f:
        f.write(content)

fix_split_logic_in_views()
