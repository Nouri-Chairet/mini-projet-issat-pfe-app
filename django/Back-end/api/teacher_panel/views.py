from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.admin_panel.permissions import IsTeacher
from api.models import Classes, Students, Attendance, Schedules,Teachers
from drf_spectacular.utils import OpenApiTypes, extend_schema
from datetime import datetime
from api.utils.convert_to_french import convert_to_french


TEACHER_GENERIC_RESPONSES = {
    200: OpenApiTypes.OBJECT,
    400: OpenApiTypes.OBJECT,
    404: OpenApiTypes.OBJECT,
    500: OpenApiTypes.OBJECT,
}


#request form 
#{
#    "schedule_id": "schedule_id",
#    "students": [
#        {  
#            "student_id": "student_id",
#            "presence": true
#        },
#            "presence": true
#        },
@extend_schema(tags=['Teacher Panel'], request=OpenApiTypes.OBJECT, responses=TEACHER_GENERIC_RESPONSES)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTeacher])
def make_presence(request):
    """
    API endpoint to make presence for a class.
    """
    try:
        students = request.data.get('students')
        schedule_id = request.data.get('schedule_id')
        if not schedule_id or not students:
            return Response({"error": "schedule_id and students are required"}, status=400)
        # Check if class_id is valid
        schedule= Schedules.objects.filter(id=schedule_id).first()
        if not schedule:
            return Response({"error": "class_id is invalid"}, status=400)
        for student in students:
            student_id = student.get('student_id')
            presence = student.get('presence')
            if not student_id or presence is None:
                return Response({"error": "student_id and presence are required"}, status=400)
            student_obj = Students.objects.filter(user=student_id).first()
            if not student_obj:
                return Response({"error": f"student_id {student_id} is invalid"}, status=400)
            if(presence == 'false'):
                student_obj.access_status = False
                student_obj.save()
            Attendance.objects.create(student=student_obj, schedule=schedule, presence=presence,class_id=schedule.class_id,marked_by=request.user)
        return Response({"message": "Presence made successfully"}, status=200)
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)
@extend_schema(tags=['Teacher Panel'], responses=TEACHER_GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def get_absence_made(request):
    attendances=Attendance.objects.filter(marked_by=request.user)
    response_data = []
    for attendance in attendances:
        if attendance.status == True:
            continue
        response_data.append({
            "student_name": attendance.student.user.username,
            "marked_time": attendance.marked_at,
            "class_name": attendance.schedule.class_id.niveau +" "+attendance.schedule.class_id.classe_section+ " " + attendance.schedule.class_id.classe_num,
            "presence": attendance.status,
        })
    return Response({"data":response_data}, status=200)
@extend_schema(tags=['Teacher Panel'], responses=TEACHER_GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def get_current_session(request):
    """
    API endpoint to get the current session.
    """
    try:
        current_date = datetime.now()
        today = current_date.strftime("%A")
        today = convert_to_french(today.lower())
        
        time= datetime.now().time()
        teacher =Teachers.objects.get(user=request.user)
        schedules = Schedules.objects.filter(teacher=teacher)
        if not schedules:
            return Response({"error": "No schedules found for the teacher"}, status=404)
        for schedule in schedules:
          

            if schedule.day_of_week.lower() == today and schedule.start_time <= time <= schedule.end_time:
                return Response({
                    "day_of_week": today,
                    "start_time": schedule.start_time,
                    "end_time": schedule.end_time,
                    "class_id":schedule.class_id.id,
                    "room": schedule.room,
                    "subject": schedule.subject,
                    "teacher_name":schedule.teacher.user.username
                })
        return Response({"message": "No classes found for today"}, status=404) 
    except Exception as e:
        return Response({"error": str(e)}, status=400)
@extend_schema(tags=['Teacher Panel'], responses=TEACHER_GENERIC_RESPONSES)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def get_classes(request):
    """
    API endpoint to get all classes.
    """
    try:
        teacher_id=request.user.id
        schedules =Schedules.objects.filter(teacher_id=teacher_id)
        if not schedules:
            return Response({"error": "No classes found for the teacher"}, status=404)
        

        response_data = []
        for schedule in schedules:
            class_id=schedule.class_id.id
            class_obj = Classes.objects.filter(id=class_id).first()
            data= {
                "id": class_obj.id,
                "niveau": class_obj.niveau,
                "classe_section": class_obj.classe_section,
                "classe_num": class_obj.classe_num,
            }
            if data not in response_data:
                response_data.append(data)
        response_data = sorted(response_data, key=lambda x: (x['niveau'], x['classe_section'], x['classe_num']))
        print(response_data)
        return Response({"classes": response_data}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)




        

        