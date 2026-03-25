from datetime import datetime
from io import BytesIO
from api.models import (
    Users,
    Teachers,
    Students,
    Classes,
    Section,
    Schedules,
    Posts,
    PostType,
    ForumQuestions,
    ForumAnswers,
    TeacherAvailabilities,
    AvailabilityContext,
    ExamSessions,
    ExamSurveillanceAssignments,
    PFESubjects,
    PFEPresentationSlots,
    PFEJuryAssignments,
    JuryRole,
)
from rest_framework.response import Response
from api.admin_panel.permissions import IsAdmin,IsAdminOrTeacher,IsAdminOrStudent
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from api.utils.pdf_uploader import upload_pdf_to_gcs


def _validate_section_level(section, level):
    if section not in Section.values:
        return "section not found"
    if level < 1:
        return "Invalid level"
    if section == Section.PREPA_MPI and level > 2:
        return "Prépa classes support niveau up to 2"
    if section != Section.PREPA_MPI and level > 3:
        return "Non-Prépa classes support niveau up to 3"
    return None


def _class_label(classe):
    return f"{classe.niveau}-{classe.classe_section}-{classe.classe_num}"


def _parse_class_token(token):
    chunks = str(token).split("-", 2)
    if len(chunks) != 3:
        return None
    niveau, section, classe_num = chunks
    return niveau.strip(), section.strip(), classe_num.strip()


def _build_exam_calendar_pdf(exams):
    pdf_buffer = BytesIO()
    pdf = canvas.Canvas(pdf_buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "Calendrier des examens")
    y -= 30
    pdf.setFont("Helvetica", 10)
    for exam in exams:
        line = f"{exam.exam_date} | {exam.subject} | {_class_label(exam.class_id)} | {exam.start_time}-{exam.end_time} | {exam.room}"
        pdf.drawString(50, y, line[:120])
        y -= 16
        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 10)
    pdf.save()
    pdf_buffer.seek(0)
    return pdf_buffer


def _teacher_surveillance_payload(teacher):
    weekly_hours = teacher.weekly_teaching_hours
    required = teacher.required_surveillance_hours
    assigned = teacher.assigned_surveillance_hours
    return {
        "teacher_id": str(teacher.user_id),
        "teacher_name": teacher.user.username,
        "weekly_teaching_hours": weekly_hours,
        "required_surveillance_hours": required,
        "assigned_surveillance_hours": assigned,
        "remaining_surveillance_hours": round(required - assigned, 2),
    }
#request under this form :  
# {
#     "level": "1A",
#     "section": "A",
#     "nb": 2
# }
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_classes (request):
    try:
        level = int(request.data.get('level'))
        section = request.data.get('section')
        nb=int(request.data.get('nb'))
        validation_error = _validate_section_level(section, level)
        if validation_error:
            return Response({"error": validation_error}, status=400)
        for i in range(1, nb+1):
            new_class = Classes.objects.create(niveau=str(level),classe_section=section,classe_num=str(i))
            new_class.save()
        return Response({"message": "Classes created successfully"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_classes (request):
    try:
        classes = Classes.objects.all()
        class_data = []
        for classe in classes:
            class_data.append({
                "id": classe.id,
                "niveau": classe.niveau,
                "section": classe.classe_section,
                "num": classe.classe_num,
            })
        return Response({"classes": class_data}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
#excel file format :
#jour,heure-debut,heure-fin,matiere,professeur,classe,salle
#classes are in this format : 1-tronc commun-3
#professors are in this format : prenom nom

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_schedule (request):
    try:
        file = request.FILES.get('file')
        
        if not file:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.xlsx'):
            return Response({"error": "Invalid file format"}, status=400)  
        df = pd.read_excel(file)
        if df.empty:
            return Response({"error": "Empty file"}, status=400)
        expected_columns =['jour','heure-debut','heure-fin','matiere','professeur','classe','salle']
        if not set(expected_columns).issubset(df.columns):
            return Response({"error": "Invalid file format"}, status=401)
        for index, row in df.iterrows():
            professeur = row['professeur']
            classe = row['classe']
            professeur_user = Users.objects.filter(username=professeur,role="teacher").first()
            professeur = Teachers.objects.filter(user=professeur_user).first()
            if not professeur:
                return Response({"error": f"Teacher {professeur} not found at row number {index}"}, status=404)
            niveau = str(classe.split("-")[0])
            section = str(classe.split("-")[1])
            classe_num = str(classe.split("-")[2])
            classe= Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
            if not classe:
                return Response({"error": f"Class {classe} not found at row number {index}"}, status=404)
            jour = row['jour']
            heure_debut = row['heure-debut']
            heure_fin = row['heure-fin']
            if jour not in ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']:
                return Response({"error": f"Invalid day at row number {index} "}, status=400)
            matiere = row['matiere']
            salle = row['salle']
            if not matiere:
                return Response({"error": f"Invalid subject at row number {index} "}, status=400)
            if not salle:
                return Response({"error": f"Invalid room at row number {index} "}, status=400)
            schedule = Schedules.objects.create(teacher=professeur, class_id=classe, day_of_week=jour, start_time=heure_debut, end_time=heure_fin, room=salle, subject=matiere)
            schedule.save()
        return Response({"message": "Schedule created successfully"}, status=201)



    except Exception as e:
        print("error",e)
        return Response({"error": str(e)}, status=500)

#request under this form :
# params = niveau section classe_num or just the class_id
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrStudent])
def get_classes_schedule (request):
    try:
        niveau= request.query_params.get('niveau')
        section= request.query_params.get('section')
        classe_num= request.query_params.get('classe_num')
        class_id = request.query_params.get('class_id')
        if (not niveau or not section or not classe_num) and (not class_id):
            return Response({"error": "Missing parameters"}, status=400)
        if class_id:
            classe = Classes.objects.filter(id=class_id).first()
        else :
            classe = Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
        schedules = Schedules.objects.filter(class_id=classe).order_by('day_of_week','start_time')
        schedule_data = []
        for schedule in schedules:
            schedule_data.append({
                "teacher": schedule.teacher.user.username,
                "day_of_week": schedule.day_of_week,
                "start_time": str(schedule.start_time),
                "end_time": str(schedule.end_time),
                "room": schedule.room,
                "subject": schedule.subject,
            })
        return Response({"schedules": schedule_data}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

#request under this form :
# params = teacher-id
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_teacher_schedule (request):
    try:
        teacher = request.query_params.get('teacher_id')
        if not teacher:
            return Response({"error": "Missing parameters"}, status=400)
        teacher = Users.objects.get(id=teacher, role="teacher")
        if not teacher:
            return Response({"error": "Teacher not found"}, status=404)
        teacher = Teachers.objects.get(user=teacher)
        schedules = Schedules.objects.filter(teacher=teacher).order_by('day_of_week','start_time')
        schedule_data = []
        for schedule in schedules:
            classe = Classes.objects.get(id=schedule.class_id.id)
            schedule_data.append({
                "id": schedule.id,
                "class": f"{classe.niveau}-{classe.classe_section}-{classe.classe_num}",
                "day_of_week": schedule.day_of_week,
                "start_time": str(schedule.start_time),
                "end_time": str(schedule.end_time),
                "room": schedule.room,
                "subject": schedule.subject,
            })
        return Response({"schedules": schedule_data}, status=200)
            
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_teachers(request):
    try:
        teachers = Teachers.objects.all()
        teacher_data = []
        for teacher in teachers:
            teacher_data.append({
                "id": teacher.user.id,
                "username": teacher.user.username,
                "email": teacher.user.email,
                "department": teacher.department,
            })
        print(teacher_data)
        
        return Response({"teachers": teacher_data}, status=200)
    
    except Exception as e:
        print("error",e)
        return Response({"error": str(e)}, status=500)

#request under this form :
# params = niveau section classe_num
#or class_id
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students(request):
    try:
        niveau = request.query_params.get('niveau')
        section = request.query_params.get('section')
        classe_num = request.query_params.get('classe_num')
        class_id =request.query_params.get('class_id')
        if (not niveau or not section or not classe_num) and (not class_id):
            return Response({"error": "Missing parameters"}, status=400)
        if class_id :
            classe = Classes.objects.filter(id=class_id).first()
        else :
            classe = Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
        students = Students.objects.filter(class_id=classe).order_by('user__username')
        student_data = []
        for student in students:
            student_data.append({
                "username": student.user.username,
                "parent_contact": student.parent_contact,
                "access_status": student.access_status,
                "email" : student.user.email, 
            })
        return Response({"students": student_data}, status=200)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

#request under this form :
# {
#     "student_id": 1,
#     "access_status": true, # not required
#     "parent_contact": "new_parent_contact", not required 
#     "email": "new_email", not required
#     "password": "new_password" , not required
#      but at least one of them is required
#}

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_student(request):
    try:
        student_id = request.data.get('student_id')
        access_status = request.data.get('access_status')
        parent_contact = request.data.get('parent_contact')
        email = request.data.get('email')
        password= request.data.get('password')
        if not student_id:
            return Response({"error": "Missing student ID"}, status=400)
        
        student = Students.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found"}, status=404)
        if not email and not password and not parent_contact:
            if not access_status:
                return Response({"error": "Missing parameters"}, status=400)
            student.access_status = access_status
            student.save()
            return Response({"message": "Student Status updated successfully"}, status=200)
        else :
            if email:
                student.user.email = email
                student.user.save()
            if password:
                student.user.set_password(password)
                student.user.save()
            if parent_contact:
                student.parent_contact = parent_contact
                student.save()
    
            
            
            
      
        return Response({"message": "Student updated successfully"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

#request under this form :
# params = student_id

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_student(request):
    try:
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({"error": "Missing student ID"}, status=400)
        
        student = Students.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found"}, status=404)
        
        student.delete()
        return Response({"message": "Student deleted successfully"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

#request under this form :
# {
#     "title": "Announcement Title",
#    "content": "Announcement content",
#   "file": "file.pdf"
# }    
# or
# {
#     "itle": "Lesson Title",
#    "content": "Lesson content",
#      "class_id":"class_id"
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def create_post(request):
    try:
        title = request.data.get('title')
        content = request.data.get('content')
        file = request.FILES.get('file')
        class_id = request.data.get('class_id')
        type =PostType.ANNOUNCEMENT
        if class_id:
            class_id = Classes.objects.filter(id=class_id).first()
            type=PostType.LESSON
            if not class_id:
                return Response({"error": "Class not found"}, status=404)
        else:
            if(request.user.role =="teacher"):
                return Response({'error':"not authenticated"},status=400)
            class_id = None
        if not title:
            return Response({"error": "Missing parameters"}, status=400)
        if not file or not content:
            return Response({"error": "No file provided"}, status=400)
        if not file.name.endswith('.pdf'):
            return Response({"error": "Invalid file format"}, status=400)
        if file.size > 10 * 1024 * 1024:  # 10 MB limit
            return Response({"error": "File size exceeds limit"}, status=400)
        url=upload_pdf_to_gcs(file)
        post = Posts.objects.create(title=title, content=content,url=url,type=type,author=request.user,class_id=class_id)
        if not post :
            return Response({"error": "Failed to create post"}, status=500)
        post.save()
        return Response({"message": "Post created successfully"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

#request under this form :
# params = post_id
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_post(request):
    try:
        post_id = request.query_params.get('post_id')
        if not post_id:
            return Response({"error": "Missing post ID"}, status=400)
        post = Posts.objects.filter(id=post_id).first()
        if not post:
            return Response({"error": "Post not found"}, status=404)
        post.delete()
        return Response({"message": "Post deleted successfully"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_post(request):
    try:
        post_id = request.data.get('post_id')
        title = request.data.get('title')
        content = request.data.get('content')
        file = request.FILES.get('file')
        if not post_id:
            return Response({"error": "Missing post ID"}, status=400)
        post = Posts.objects.filter(id=post_id).first()
        if not post:
            return Response({"error": "Post not found"}, status=404)
        post.title = title if title else post.title
        post.content = content if content else post.content
        post.url = upload_pdf_to_gcs(file) if file else post.url
        post.save()
        return Response({"message": "Post updated successfully"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lesson_posts(request):
    classe_id =request.query_params.get("classe_id")
    posts=Posts.objects.filter(type=PostType.LESSON ,class_id=classe_id).order_by('created_at')

    posts_data=[]
    for post in posts:
        posts_data.append(
            {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "url": post.url,
                "type": post.type,
                "created_at": str(post.created_at),
                "author": post.author.username,
            }
        )
    return Response({"lessons":posts_data},status=200)
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_announcement_posts(request):
    try:
        posts = Posts.objects.filter(type=PostType.ANNOUNCEMENT).order_by('-created_at')
        post_data = []
        for post in posts:
            post_data.append({
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "url": post.url,
                "type": post.type,
                "created_at": str(post.created_at),
                "author": post.author.username,
            })
        return Response({"posts": post_data}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_forum_question(request):
    title = request.data.get('title')
    content = request.data.get('content')
    class_id = request.data.get('class_id')
    if not title or not content:
        return Response({"error": "title and content are required"}, status=400)
    classe = None
    if class_id:
        classe = Classes.objects.filter(id=class_id).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
    question = ForumQuestions.objects.create(
        author=request.user,
        class_id=classe,
        title=title,
        content=content,
    )
    return Response({"id": str(question.id), "message": "Question created"}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def answer_forum_question(request):
    question_id = request.data.get('question_id')
    content = request.data.get('content')
    if not question_id or not content:
        return Response({"error": "question_id and content are required"}, status=400)
    question = ForumQuestions.objects.filter(id=question_id).first()
    if not question:
        return Response({"error": "Question not found"}, status=404)
    answer = ForumAnswers.objects.create(question=question, author=request.user, content=content)
    return Response({"id": str(answer.id), "message": "Answer added"}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_forum_questions(request):
    class_id = request.query_params.get('class_id')
    questions = ForumQuestions.objects.all().order_by('-created_at')
    if class_id:
        questions = questions.filter(class_id=class_id)
    payload = []
    for q in questions:
        payload.append({
            "id": str(q.id),
            "title": q.title,
            "content": q.content,
            "author": q.author.username,
            "class_id": str(q.class_id_id) if q.class_id_id else None,
            "is_resolved": q.is_resolved,
            "created_at": str(q.created_at),
            "answers_count": q.answers.count(),
        })
    return Response({"questions": payload}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def set_teacher_availability(request):
    try:
        context = request.data.get('context')
        day_of_week = request.data.get('day_of_week')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        teacher_id = request.data.get('teacher_id')

        if context not in AvailabilityContext.values:
            return Response({"error": "Invalid context"}, status=400)

        if request.user.role == 'teacher':
            teacher = Teachers.objects.filter(user=request.user).first()
        else:
            if not teacher_id:
                return Response({"error": "teacher_id is required for admin"}, status=400)
            teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
            teacher = Teachers.objects.filter(user=teacher_user).first()

        if not teacher:
            return Response({"error": "Teacher not found"}, status=404)
        if not day_of_week or not start_time or not end_time:
            return Response({"error": "day_of_week, start_time and end_time are required"}, status=400)

        TeacherAvailabilities.objects.create(
            teacher=teacher,
            context=context,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
        )
        return Response({"message": "Availability saved"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_teacher_surveillance_load(request):
    teacher_id = request.query_params.get('teacher_id')
    if request.user.role == 'teacher':
        teacher = Teachers.objects.filter(user=request.user).first()
    else:
        if not teacher_id:
            return Response({"error": "teacher_id is required"}, status=400)
        teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
        teacher = Teachers.objects.filter(user=teacher_user).first()

    if not teacher:
        return Response({"error": "Teacher not found"}, status=404)
    return Response(_teacher_surveillance_payload(teacher), status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_exam_calendar_manual(request):
    try:
        class_id = request.data.get('class_id')
        subject = request.data.get('subject')
        exam_date = request.data.get('exam_date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        room = request.data.get('room')
        teacher_ids = request.data.get('teacher_ids', [])

        classe = Classes.objects.filter(id=class_id).first()
        if not classe:
            return Response({"error": "Class not found"}, status=404)
        if not subject or not exam_date or not start_time or not end_time or not room:
            return Response({"error": "Missing required fields"}, status=400)

        exam = ExamSessions.objects.create(
            class_id=classe,
            subject=subject,
            exam_date=exam_date,
            start_time=start_time,
            end_time=end_time,
            room=room,
            created_by=request.user,
        )

        for teacher_id in teacher_ids:
            teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
            teacher = Teachers.objects.filter(user=teacher_user).first()
            if teacher:
                ExamSurveillanceAssignments.objects.get_or_create(exam_session=exam, teacher=teacher)

        return Response({"exam_id": str(exam.id), "message": "Exam session created"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_exam_calendar_from_excel(request):
    try:
        file = request.FILES.get('file')
        if not file or not file.name.endswith('.xlsx'):
            return Response({"error": "A valid .xlsx file is required"}, status=400)

        df = pd.read_excel(file)
        expected_columns = ['matiere', 'classe', 'enseignants', 'date', 'heure-debut', 'heure-fin', 'salle']
        if not set(expected_columns).issubset(df.columns):
            return Response({"error": "Invalid file format"}, status=400)

        created_exams = []
        for index, row in df.iterrows():
            class_parts = _parse_class_token(row['classe'])
            if not class_parts:
                return Response({"error": f"Invalid class format at row {index + 1}"}, status=400)

            niveau, section, classe_num = class_parts
            classe = Classes.objects.filter(niveau=niveau, classe_section=section, classe_num=classe_num).first()
            if not classe:
                return Response({"error": f"Class not found at row {index + 1}"}, status=404)

            exam = ExamSessions.objects.create(
                class_id=classe,
                subject=str(row['matiere']),
                exam_date=row['date'],
                start_time=row['heure-debut'],
                end_time=row['heure-fin'],
                room=str(row['salle']),
                created_by=request.user,
            )
            created_exams.append(exam)

            for teacher_name in str(row['enseignants']).split(';'):
                teacher_user = Users.objects.filter(username=teacher_name.strip(), role='teacher').first()
                teacher = Teachers.objects.filter(user=teacher_user).first()
                if teacher:
                    ExamSurveillanceAssignments.objects.get_or_create(exam_session=exam, teacher=teacher)

        pdf_buffer = _build_exam_calendar_pdf(created_exams)
        pdf_buffer.name = 'exam_calendar.pdf'
        pdf_url = upload_pdf_to_gcs(pdf_buffer)

        return Response(
            {
                "message": "Exam calendar processed",
                "created_count": len(created_exams),
                "pdf_url": pdf_url,
            },
            status=201,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_pfe_subjects_from_excel(request):
    try:
        file = request.FILES.get('file')
        if not file or not file.name.endswith('.xlsx'):
            return Response({"error": "A valid .xlsx file is required"}, status=400)

        df = pd.read_excel(file)
        expected_columns = ['nom de sujet PFE', 'nom de l’étudiant', 'nom de l’encadreur']
        if not set(expected_columns).issubset(df.columns):
            expected_columns = ['sujet_pfe', 'etudiant', 'encadreur']
            if not set(expected_columns).issubset(df.columns):
                return Response({"error": "Invalid file format"}, status=400)

        created = 0
        for _, row in df.iterrows():
            title = str(row.get('nom de sujet PFE') or row.get('sujet_pfe'))
            student_name = str(row.get('nom de l’étudiant') or row.get('etudiant'))
            supervisor_name = str(row.get('nom de l’encadreur') or row.get('encadreur'))
            supervisor_user = Users.objects.filter(username=supervisor_name, role='teacher').first()
            supervisor = Teachers.objects.filter(user=supervisor_user).first()
            if not supervisor:
                continue
            PFESubjects.objects.create(
                title=title,
                student_name=student_name,
                supervisor=supervisor,
                created_by=request.user,
            )
            created += 1

        return Response({"message": "PFE subjects imported", "created_count": created}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def assign_pfe_jury(request):
    try:
        pfe_subject_id = request.data.get('pfe_subject_id')
        rapporteur_id = request.data.get('rapporteur_id')
        president_id = request.data.get('president_id')
        date_value = request.data.get('date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        room = request.data.get('room')

        pfe_subject = PFESubjects.objects.filter(id=pfe_subject_id).first()
        if not pfe_subject:
            return Response({"error": "PFE subject not found"}, status=404)

        slot = None
        if date_value and start_time and end_time and room:
            slot = PFEPresentationSlots.objects.create(
                presentation_date=date_value,
                start_time=start_time,
                end_time=end_time,
                room=room,
                created_by=request.user,
            )

        PFEJuryAssignments.objects.get_or_create(
            pfe_subject=pfe_subject,
            teacher=pfe_subject.supervisor,
            role=JuryRole.ENCADREUR,
            defaults={"slot": slot, "assigned_by": request.user},
        )

        for role, teacher_id in [(JuryRole.RAPPORTEUR, rapporteur_id), (JuryRole.PRESIDENT, president_id)]:
            if not teacher_id:
                continue
            teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
            teacher = Teachers.objects.filter(user=teacher_user).first()
            if teacher:
                PFEJuryAssignments.objects.get_or_create(
                    pfe_subject=pfe_subject,
                    teacher=teacher,
                    role=role,
                    defaults={"slot": slot, "assigned_by": request.user},
                )

        return Response({"message": "Jury assigned"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTeacher])
def get_pfe_teacher_quota(request):
    teacher_id = request.query_params.get('teacher_id')
    if request.user.role == 'teacher':
        teacher = Teachers.objects.filter(user=request.user).first()
    else:
        if not teacher_id:
            return Response({"error": "teacher_id is required"}, status=400)
        teacher_user = Users.objects.filter(id=teacher_id, role='teacher').first()
        teacher = Teachers.objects.filter(user=teacher_user).first()
    if not teacher:
        return Response({"error": "Teacher not found"}, status=404)

    assigned_count = PFEJuryAssignments.objects.filter(teacher=teacher).count()
    required_count = teacher.required_pfe_presentations
    return Response(
        {
            "teacher_id": str(teacher.user_id),
            "teacher_name": teacher.user.username,
            "supervised_subjects": required_count // 3,
            "required_presentations": required_count,
            "assigned_presentations": assigned_count,
            "remaining_presentations": max(required_count - assigned_count, 0),
        },
        status=200,
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated,IsAdmin])
def resolve_absence(request):
    student_id=request.data.get("student_id")
    student =Students.objects.get(user=student_id)
    if not student :
        return Response({"error":"not found"},status=404)
    student.access_status=True
    student.save()
    return Response({"message":"student access status updated successfully"},status=200)
