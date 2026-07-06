from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role", "profile_photo_url", 
            "banner_image_url", "bio", "subjects_of_interest", 
            "xp_points", "streak_days", "is_premium", "premium_until", "created_at"
        ]
        read_only_fields = ["id", "xp_points", "streak_days", "is_premium", "premium_until", "created_at"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]

    def validate_role(self, value):
        if value not in ["student", "instructor"]:
            raise serializers.ValidationError("Cannot register as an administrator publicly. Public registrations only allow student or instructor roles.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            role=validated_data.get("role", "student"),
        )
        return user
