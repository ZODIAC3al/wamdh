from django.db import models
from django.contrib.auth import get_user_model
from apps.notes.models import Note

User = get_user_model()

class Quiz(models.Model):
    DIFFICULTY = [("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")]
    QTYPES = [("mcq", "MCQ"), ("tf", "True/False"), ("short", "Short Answer")]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.ForeignKey(Note, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY)
    question_type = models.CharField(max_length=10, choices=QTYPES)
    questions = models.JSONField()  # list of question objects
    time_limit_minutes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.difficulty})"

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    answers = models.JSONField()
    score = models.FloatField()
    time_taken_seconds = models.IntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attempt by {self.user.username} on {self.quiz.title} ({self.score}%)"
