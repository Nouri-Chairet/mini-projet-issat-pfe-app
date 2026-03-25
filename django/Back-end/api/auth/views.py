from django.shortcuts import redirect
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from api.models import Users, Teachers, Students, Classes, UserRole
from api.auth.serializers import UserSerializer, TeacherSerializer
from api.auth.permissions import IsAdmin
from rest_framework.permissions import IsAuthenticated
from api.utils.email import send_account_created_email
from django.utils import timezone
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
import uuid

@api_view(['POST'])
def refresh_token(request):
    refresh = request.data.get('refresh')
    try:
        token = RefreshToken(refresh)
        user_id = token['user_id']
        user = Users.objects.get(id=user_id)
        new_refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(new_refresh),
            'access': str(new_refresh.access_token)
        })
    except Exception as e:
        print(e)
        return Response({'detail': str(e)}, status=400)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def register_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    username = request.data.get('username')
    role = request.data.get('role')
    try:
        if Users.objects.filter(email=email).exists():
            return Response({'detail': 'Email already exists'}, status=400)
        if role.lower() == 'admin':
            role = UserRole.ADMIN.value
            user = Users.objects.create(email=email, password=password, username=username, role=role)
            user.save()
            tokens = user.get_tokens()
            return Response(tokens)
        elif role.lower() == 'student':
            role = UserRole.STUDENT.value
            user = Users.objects.create(email=email, password=password, username=username, role=role)
            user.save()
            class_id = request.data.get('class_id')
            class_instance = Classes.objects.get(id=class_id)

            if class_instance:
                parent_contact = request.data.get('parent_contact')
                student = Students.objects.create(user=user, class_id=class_instance, parent_contact=parent_contact)
                student.save()
                tokens = user.get_tokens()
                send_account_created_email(email, user.username, password)
                return Response(tokens)
            else:
                return Response({'detail': 'Class not found'}, status=404)
        elif role.lower() == 'teacher':
            role = UserRole.TEACHER.value
            user = Users.objects.create(email=email, password=password, username=username, role=role)
            user.save()
            department = request.data.get('department')
            ncin = request.data.get('ncin')
            age = request.data.get('age')
            teacher = Teachers.objects.create(user=user, department=department, ncin=ncin, age=age)
            teacher.save()
            tokens = user.get_tokens()
            return Response(tokens)
        else:
            return Response({'detail': 'Invalid role'}, status=400)
    except Classes.DoesNotExist:
        return Response({'detail': 'Class not found'}, status=404)
    except Exception as e:
        return Response({'detail': str(e)}, status=500)
    
    
@api_view(['PATCH'])
def update_password(request):
    new_password = request.data.get('new_password')
    old_password = request.data.get('old_password')
    user = request.user
    if user.check_password(old_password):
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated successfully'}, status=200)
    else:
        return Response({'detail': 'Old password is incorrect'}, status=400)


@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    try:
        user = Users.objects.get(email=email)
        if check_password(password, user.password):
            tokens = user.get_tokens()
            return Response(tokens)
        else:
            return Response({'detail': 'Invalid credentials'}, status=400)
    except Users.DoesNotExist:
        return Response({'detail': 'User not found'}, status=404)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_account(request):
    user = request.user
    data = request.data
    role = user.role
    if role == UserRole.ADMIN:
        serializer = UserSerializer(user, data=data, partial=True)
    elif role == UserRole.TEACHER:
        try:
            teacher = Teachers.objects.get(user=user)
        except Teachers.DoesNotExist:
            return Response({'detail': 'Teacher profile not found'}, status=404)
        serializer = TeacherSerializer(teacher, data=data, partial=True)
    elif role == UserRole.STUDENT:
        try:
            student = Students.objects.get(user=user)
        except Students.DoesNotExist:
            return Response({'detail': 'Student profile not found'}, status=404)
        # You may want to create a StudentSerializer for more fields
        serializer = UserSerializer(user, data=data, partial=True)
    else:
        return Response({'detail': 'Invalid role'}, status=400)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')
    print(email)
    if not email:
        return Response({'detail': 'Email is required'}, status=400)
    try:
        user = Users.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.id))
        reset_url = request.build_absolute_uri(
            "http://127.0.0.1:8000/api/auth/forget-password/confirme/" + f'?uid={uid}&token={token}'
        )
        send_mail(
            'Password Reset',
            f'Click the link to reset your password: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return Response({'detail': 'Password reset link sent.'})
    except Users.DoesNotExist:
        return Response({'detail': 'User not found'}, status=404)
    except Exception as e:
        print(str(e))
        return Response({'detail': str(e)}, status=500)
@api_view(['GET'])
def reset_password_verify(request):
    token = request.query_params.get('token')
    uid = request.query_params.get('uid')

    try:
        uid = force_str(urlsafe_base64_decode(uid))
        user = Users.objects.get(id=uid)
    
    except (TypeError, ValueError, OverflowError, Users.DoesNotExist):
        return Response({'detail': 'Invalid link.'}, status=status.HTTP_400_BAD_REQUEST)

    if default_token_generator.check_token(user, token):
        # ✅ Token is valid — redirect to frontend change password page
        return redirect(f'http://localhost:5173/change-password?uid={request.query_params.get("uid")}&token={token}')
    else:
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
def reset_password(request):
    token = request.data.get('token')
    uid = request.data.get('uid')
    
    try:
        user = Users.objects.get(id=uuid.UUID(force_str(urlsafe_base64_decode(uid))))
        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user:
            return Response({'detail': 'Invalid link.'}, status=status.HTTP_400_BAD_REQUEST)
        new_password = request.data.get('new_password')
        if new_password:
            print(user)
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'Password updated successfully'}, status=200)
        else:
            return Response({'detail': 'New password is required'}, status=400)
    except Exception as e:
        print(str(e))
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher(request):
    user = request.user
    if user.role == UserRole.TEACHER:
        try:
            teacher = Teachers.objects.get(user=user)
            return Response({
                'id': teacher.id,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'role': user.role
                },
                'department': teacher.department,
                'ncin': teacher.ncin,
                'age': teacher.age,
                'created_at': teacher.created_at,
                'updated_at': teacher.updated_at
            },status=200)
        except Teachers.DoesNotExist:
            return Response({'detail': 'Teacher not found'}, status=404)
    else:
        return Response({'detail': 'User is not a teacher'}, status=403)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student(request):
    user = request.user
    if user.role == UserRole.STUDENT:
        try:
            student = Students.objects.get(user=user)
            return Response({
                'id': student.user.id,
                'user': {
                    'id': student.user.id,
                    'email': student.user.email,
                    'username': student.user.username,
                    'role': student.user.role
                },
                'class_id': student.class_id.id,
                'class_name': student.class_id.niveau + ' ' + student.class_id.classe_section + ' ' + str(student.class_id.classe_num),
                'parent_contact': student.parent_contact,
                'created_at': student.user.created_at,
            },status=200)
        except Students.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=404)
    else:
        return Response({'detail': 'User is not a student'}, status=403)
@api_view(['POST'])
def reset_password_confirm(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = Users.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, Users.DoesNotExist):
        return Response({'detail': 'Invalid link.'}, status=status.HTTP_400_BAD_REQUEST)
    if default_token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password has been reset.'})
    else:
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


