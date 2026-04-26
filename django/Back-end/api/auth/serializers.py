from rest_framework import serializers
from api.models import Users
from api.models import Teachers
from api.models import Students
from api.models import Classes


class UserSerializer (serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['id', 'username', 'email', 'password', 'role','created_at','last_login']
        extra_kwargs = {
            'password': {'write_only': True}
        }
class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teachers
        fields = ['user', 'department', 'ncin', 'age']
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'TEACHER'  
        user = Users.objects.create(**user_data)
        teacher = Teachers.objects.create(user=user, **validated_data)
        return teacher
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Students
        fields = ['user', 'class_id', 'parent_contact', 'access_status']
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classes
        fields = ['id', 'niveau', 'classe_section', 'classe_num']
    def create(self, validated_data):
        return Classes.objects.create(**validated_data)
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class TokenPairSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    access = serializers.CharField()


class MessageSerializer(serializers.Serializer):
    detail = serializers.CharField()


class LoginRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class RefreshTokenRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class RegisterRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()
    password = serializers.CharField()
    role = serializers.ChoiceField(choices=['admin', 'teacher', 'student'])
    class_id = serializers.UUIDField(required=False)
    parent_contact = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    ncin = serializers.CharField(required=False, allow_blank=True)
    age = serializers.IntegerField(required=False)


class UpdatePasswordRequestSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField()


class UpdateAccountRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=False)
    department = serializers.CharField(required=False)
    ncin = serializers.CharField(required=False)
    age = serializers.IntegerField(required=False)
    parent_contact = serializers.CharField(required=False)
    access_status = serializers.BooleanField(required=False)


class ForgotPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordRequestSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField()


class UserSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    email = serializers.EmailField()
    username = serializers.CharField()
    role = serializers.CharField()


class TeacherProfileResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    user = UserSummarySerializer()
    department = serializers.CharField()
    ncin = serializers.CharField()
    age = serializers.IntegerField()
    is_department_head = serializers.BooleanField(required=False)
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    updated_at = serializers.DateTimeField(required=False, allow_null=True)


class StudentProfileResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    user = UserSummarySerializer()
    class_id = serializers.UUIDField()
    class_name = serializers.CharField()
    parent_contact = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()




