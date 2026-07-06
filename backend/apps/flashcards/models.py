from django.db import models
from django.contrib.auth import get_user_model
from apps.notes.models import Note

User = get_user_model()

class FlashcardDeck(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.ForeignKey(Note, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.subject})"

class Flashcard(models.Model):
    RATINGS = [("again", "Again"), ("hard", "Hard"), ("good", "Good"), ("easy", "Easy")]
    
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE)
    front = models.TextField()
    back = models.TextField()
    
    # SM-2 Spaced Repetition fields
    ease_factor = models.FloatField(default=2.5)
    interval_days = models.IntegerField(default=1)
    repetitions = models.IntegerField(default=0)
    next_review = models.DateField(auto_now_add=True)
    last_rating = models.CharField(max_length=10, choices=RATINGS, blank=True)

    def __str__(self):
        return f"Card in {self.deck.title}: {self.front[:30]}..."
