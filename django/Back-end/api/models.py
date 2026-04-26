import uuid
from datetime import datetime, date, timedelta
from django.db import models
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from rest_framework_simplejwt.tokens import RefreshToken


class UserRole(models.TextChoices):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class Section(models.TextChoices):
    PREPA_MPI = "Prépa"
    L_LSI = "L-LSI"
    L_MECANIQUE = "L-Mécanique"
    L_ENERGIE = "L-Energie"
    CYCLE_INGENIEUR = "Cycle Ingénieur"


class AvailabilityContext(models.TextChoices):
    SURVEILLANCE = "surveillance"
    PFE = "pfe"


class JuryRole(models.TextChoices):
    ENCADREUR = "encadreur"
    RAPPORTEUR = "rapporteur"
    PRESIDENT = "president"


class PostType(models.TextChoices):
    LESSON = "lesson"
    ANNOUNCEMENT = "announcement"

class WeekDay(models.TextChoices):
    MONDAY = "Lundi"
    TUESDAY = "Mardi"
    WEDNESDAY = "Mercredi"
    THURSDAY = "jeudi"
    FRIDAY = "Vendredi"
    SATURDAY = "Samedi"

class UsersManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)

class Users(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True)
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[RegexValidator(regex=r'^[A-Za-z ]+$', message='Username can only contain letters and spaces')]
    )
    password = models.TextField()
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.STUDENT)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsersManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if not self.password.startswith('pbkdf2_sha256$'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)
    def get_tokens(self):
        refresh = RefreshToken.for_user(self)
        refresh["role"] = self.role  
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    class Meta:
        db_table = 'users'


# Teachers Table
class Teachers(models.Model):
    user = models.OneToOneField(Users, models.CASCADE, primary_key=True)
    department = models.TextField()
    ncin = models.CharField(
        max_length=8,
        validators=[RegexValidator(regex=r'^\d{8}$', message='NCIN must be exactly 8 numerical digits')]
    )
    age = models.IntegerField(validators=[MinValueValidator(23), MaxValueValidator(65)])

    class Meta:
        managed=False
        db_table = 'teachers'

# Classes Table
class Classes(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    niveau = models.TextField()
    classe_section = models.CharField(max_length=40, choices=Section.choices, default=Section.PREPA_MPI)
    classe_num = models.TextField()

    def clean(self):
        try:
            niveau_value = int(self.niveau)
        except (TypeError, ValueError):
            raise ValidationError({"niveau": "niveau must be a number."})

        try:
            classe_num_value = int(self.classe_num)
        except (TypeError, ValueError):
            raise ValidationError({"classe_num": "classe_num must be a number."})

        if niveau_value < 1:
            raise ValidationError({"niveau": "niveau must be greater than 0."})

        if classe_num_value < 1:
            raise ValidationError({"classe_num": "classe_num must be greater than 0."})

        if self.classe_section == Section.PREPA_MPI and niveau_value > 2:
            raise ValidationError({"niveau": "Prépa classes accept max niveau 2."})

        if self.classe_section != Section.PREPA_MPI and niveau_value > 3:
            raise ValidationError({"niveau": "Non-Prépa classes accept max niveau 3."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        managed=False
        db_table = 'classes'

# Students Table
class Students(models.Model):
    user = models.OneToOneField(Users, models.CASCADE, primary_key=True)
    class_id = models.ForeignKey(Classes, models.CASCADE, db_column='class_id', blank=True, null=True)
    parent_contact = models.CharField(max_length=8, blank=True, null=True)
    access_status = models.BooleanField(default=True)

    class Meta:
        managed=False
        db_table = 'students'

# Schedules Table
class Schedules(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teachers, models.CASCADE, db_column='teacher_id')
    class_id = models.ForeignKey(Classes, models.CASCADE, db_column='class_id')
    day_of_week = models.CharField(max_length=10, choices=WeekDay.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.TextField()
    subject = models.TextField()

    class Meta:
        managed=False
        db_table = 'schedules'

    def duration_hours(self):
        start_dt = datetime.combine(date.today(), self.start_time)
        end_dt = datetime.combine(date.today(), self.end_time)
        if end_dt <= start_dt:
            return 0.0
        return (end_dt - start_dt).total_seconds() / 3600


class TimetablePublications(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    published_by = models.ForeignKey(Users, models.SET_NULL, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'timetable_publications'


class TimetableTelemetry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Users, models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, blank=True, null=True)
    event_name = models.CharField(max_length=120)
    route = models.CharField(max_length=180, blank=True, null=True)
    payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'timetable_telemetry'

class Posts(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(Users, models.CASCADE)
    class_id = models.ForeignKey(Classes, models.CASCADE, db_column='class_id', blank=True, null=True)
    title = models.TextField()
    url=models.TextField()
    content = models.TextField()
    type = models.CharField(max_length=20, choices=PostType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed=False
        db_table = 'posts'


class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Students, models.CASCADE, blank=True, null=True)
    schedule = models.ForeignKey(Schedules, models.CASCADE, blank=True, null=True)
    session_date = models.DateField()
    status = models.BooleanField(blank=True, null=True)
    marked_at = models.DateTimeField(auto_now_add=True)
    marked_by = models.ForeignKey(Users, models.CASCADE, blank=True, null=True)

    class Meta:
        db_table = 'attendance'
        unique_together = (('student', 'schedule', 'session_date'),)


class Departments(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120, unique=True)
    head = models.OneToOneField('Teachers', models.SET_NULL, null=True, blank=True, related_name='headed_department')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'departments'


class ForumQuestions(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(Users, models.CASCADE)
    class_id = models.ForeignKey(Classes, models.SET_NULL, db_column='class_id', null=True, blank=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'forum_questions'


class ForumAnswers(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(ForumQuestions, models.CASCADE, related_name='answers')
    author = models.ForeignKey(Users, models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'forum_answers'


class TeacherAvailabilities(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teachers, models.CASCADE, db_column='teacher_id', related_name='availabilities')
    context = models.CharField(max_length=20, choices=AvailabilityContext.choices)
    day_of_week = models.CharField(max_length=10, choices=WeekDay.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teacher_availabilities'
        unique_together = (('teacher', 'context', 'day_of_week', 'start_time', 'end_time'),)


class ExamSessions(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_id = models.ForeignKey(Classes, models.CASCADE, db_column='class_id')
    subject = models.CharField(max_length=200)
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=120)
    created_by = models.ForeignKey(Users, models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exam_sessions'

    def duration_hours(self):
        start_dt = datetime.combine(date.today(), self.start_time)
        end_dt = datetime.combine(date.today(), self.end_time)
        if end_dt <= start_dt:
            return 0.0
        return (end_dt - start_dt).total_seconds() / 3600


class ExamSurveillanceAssignments(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam_session = models.ForeignKey(ExamSessions, models.CASCADE, related_name='surveillance_assignments')
    teacher = models.ForeignKey(Teachers, models.CASCADE, db_column='teacher_id', related_name='exam_surveillance_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exam_surveillance_assignments'
        unique_together = (('exam_session', 'teacher'),)


class PFESubjects(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    student_name = models.CharField(max_length=150)
    supervisor = models.ForeignKey(Teachers, models.CASCADE, db_column='supervisor_id', related_name='supervised_pfe_subjects')
    created_by = models.ForeignKey(Users, models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pfe_subjects'


class PFEPresentationSlots(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    presentation_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=120)
    created_by = models.ForeignKey(Users, models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pfe_presentation_slots'


class PFEJuryAssignments(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pfe_subject = models.ForeignKey(PFESubjects, models.CASCADE, related_name='jury_assignments')
    teacher = models.ForeignKey(Teachers, models.CASCADE, db_column='teacher_id', related_name='pfe_jury_assignments')
    slot = models.ForeignKey(PFEPresentationSlots, models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=JuryRole.choices)
    assigned_by = models.ForeignKey(Users, models.SET_NULL, null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pfe_jury_assignments'
        unique_together = (('pfe_subject', 'teacher', 'role'),)


def _teacher_weekly_teaching_hours(teacher):
    schedules = Schedules.objects.filter(teacher=teacher)
    return round(sum(s.duration_hours() for s in schedules), 2)


def _teacher_assigned_surveillance_hours(teacher):
    assignments = ExamSurveillanceAssignments.objects.filter(teacher=teacher).select_related('exam_session')
    return round(sum(a.exam_session.duration_hours() for a in assignments), 2)


def _teacher_required_pfe_presentations(teacher):
    supervised_count = PFESubjects.objects.filter(supervisor=teacher).count()
    return supervised_count * 3


Teachers.weekly_teaching_hours = property(_teacher_weekly_teaching_hours)
Teachers.required_surveillance_hours = property(_teacher_weekly_teaching_hours)
Teachers.assigned_surveillance_hours = property(_teacher_assigned_surveillance_hours)
Teachers.required_pfe_presentations = property(_teacher_required_pfe_presentations)
