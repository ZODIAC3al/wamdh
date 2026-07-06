from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    duration_minutes = models.IntegerField()
    activity_type = models.CharField(max_length=20)  # note, quiz, flashcard, chat
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} studied {self.subject} ({self.duration_minutes}m) on {self.date}"
