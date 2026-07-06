from rest_framework import serializers

class QuizSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=255, required=True)
    difficulty = serializers.CharField(max_length=10, required=True)
    question_type = serializers.CharField(max_length=10, required=True)
    questions = serializers.ListField(child=serializers.DictField(), required=True)
    time_limit_minutes = serializers.IntegerField(required=False, default=0)
    created_at = serializers.CharField(read_only=True)

class QuizAttemptSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    quiz = serializers.CharField(required=False, default="")  # Holds the MongoDB quiz ID
    quiz_title = serializers.CharField(read_only=True, required=False, default="")
    answers = serializers.ListField(child=serializers.DictField(), required=True)
    score = serializers.FloatField(required=True)
    time_taken_seconds = serializers.IntegerField(required=True)
    completed_at = serializers.CharField(read_only=True)
