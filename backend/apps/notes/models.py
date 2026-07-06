from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list)
    raw_text = models.TextField()
    file_url = models.URLField(blank=True)
    file_type = models.CharField(max_length=20)  # pdf, image, text
    chunks = models.JSONField(default=list)  # list of text chunks
    word_count = models.IntegerField(default=0)
    is_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.subject})"

class Embedding(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE)
    chunk_index = models.IntegerField()
    chunk_text = models.TextField()
    embedding_vector = models.JSONField()  # 384-dim list
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Embedding for {self.note.title} [Chunk {self.chunk_index}]"
