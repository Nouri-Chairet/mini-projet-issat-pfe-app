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




