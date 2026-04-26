import os
import sys
import django
import uuid
import random
from datetime import date, time, timedelta

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Back-end.settings')
django.setup()

from api.models import (
    Users, Teachers, Students, Classes, Departments, 
    PFECampaigns, PFECampaignRooms, PFESubjects, TeacherAvailabilities, 
    UserRole, Section, WeekDay, AvailabilityContext, AvailabilityLevel, JuryRole
)

def seed_db():
    print("Clearing old PFE and User data...")
    # Clean everything to avoid orphans
    PFECampaigns.objects.all().delete()
    PFESubjects.objects.all().delete()
    Departments.objects.all().delete()
    TeacherAvailabilities.objects.all().delete()
    Classes.objects.all().delete()
    Students.objects.all().delete()
    Teachers.objects.all().delete()
    Users.objects.exclude(email='admin@issat.rnu.tn').delete() # keep admin if already there

    print("Creating admin...")
    admin_qs = Users.objects.filter(email='admin@issat.rnu.tn')
    if not admin_qs.exists():
        admin = Users.objects.create_user(email='admin@issat.rnu.tn', username='Admin Issat', password='password123', role=UserRole.ADMIN)
    else:
        admin = admin_qs.first()

    print("Creating 6 third-year classes...")
    classes = []
    for i in range(1, 7):
        c, _ = Classes.objects.get_or_create(niveau="3", classe_section=Section.L_LSI, classe_num=str(i))
        classes.append(c)

    print("Creating teachers...")
    teachers = []
    for i in range(1, 7):
        email = f't{i}@issat.rnu.tn'
        uname = f'Teacher {i} Name'
        u = Users.objects.create_user(email=email, username=uname, password='password123', role=UserRole.TEACHER)
        t = Teachers.objects.create(user=u, department='Informatique', ncin=f'0000000{i}', age=40+i)
        teachers.append(t)

    print("Creating department... (Teacher 1 is Chef)")
    dept = Departments.objects.create(name='Informatique', head=teachers[0])

    print("Creating 22 students...")
    students = []
    for k in range(1, 23):
        email = f's{k}@issat.rnu.tn'
        uname = f'Student {k} Name'
        u = Users.objects.create_user(email=email, username=uname, password='password123', role=UserRole.STUDENT)
        assigned_class = classes[k % 6] # Distribute across the 6 classes
        s = Students.objects.create(user=u, class_id=assigned_class, parent_contact=f'888888{k:02d}')
        students.append(s)

    print("Creating PFE Campaign...")
    today = date.today()
    campaign = PFECampaigns.objects.create(
        department=dept,
        name=f"Campagne PFE {today.year}",
        start_date=today,
        end_date=today + timedelta(days=7),
        day_start_time=time(8, 0),
        day_end_time=time(18, 0),
        slot_duration_minutes=60,
        break_duration_minutes=15,
        weekdays=["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    )

    # Rooms
    PFECampaignRooms.objects.create(campaign=campaign, room_name="B1")
    PFECampaignRooms.objects.create(campaign=campaign, room_name="B2")
    PFECampaignRooms.objects.create(campaign=campaign, room_name="Lab 1")

    print("Creating 22 PFE Subjects with descriptions and department...")
    for k in range(22):
        supervisor_index = k % len(teachers)
        PFESubjects.objects.create(
            title=f"Sujet PFE {k+1} - Innovation Tech",
            student_name=students[k].user.username,
            student=students[k],
            supervisor=teachers[supervisor_index],
            created_by=admin,
            department=dept,
            description=f"Description détaillée du projet {k+1}. Ce projet PFE se concentre sur les technologies modernes avec une application directe dans l'industrie."
        )

    print("Done! DB Seeded.")
    print("Admin: admin@issat.rnu.tn / password123")
    print(f"Teacher 1 (Chef Dept): t1@issat.rnu.tn / password123")

if __name__ == '__main__':
    seed_db()
