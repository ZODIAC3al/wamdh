from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLES = [("student", "Student"), ("instructor", "Instructor"), ("admin", "Admin")]
    
    role = models.CharField(max_length=20, choices=ROLES, default="student")
    profile_photo_url = models.URLField(blank=True)
    banner_image_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    subjects_of_interest = models.JSONField(default=list)
    xp_points = models.IntegerField(default=0)
    streak_days = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    is_banned = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    premium_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    def save(self, *args, **kwargs):
        from config.mongodb import users_col, get_object_id
        
        if self.is_superuser:
            self.role = "admin"

        user_data = {
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "xp_points": self.xp_points,
            "streak_days": self.streak_days,
            "profile_photo_url": self.profile_photo_url,
            "banner_image_url": self.banner_image_url,
            "bio": self.bio,
            "is_banned": self.is_banned,
            "is_premium": self.is_premium,
            "premium_until": self.premium_until.isoformat() if self.premium_until else None,
        }
        if self.password:
            user_data["password"] = self.password

        is_mongo_id = isinstance(self.id, str) and len(self.id) == 24
        
        if is_mongo_id:
            users_col.update_one(
                {"_id": get_object_id(self.id)},
                {"$set": user_data},
                upsert=True
            )
        else:
            super().save(*args, **kwargs)
            user_data["sql_id"] = self.id
            users_col.update_one(
                {"username": self.username},
                {"$set": user_data},
                upsert=True
            )

from django.db.models.signals import post_save
from django.dispatch import receiver
from config.mongodb import users_col

@receiver(post_save, sender=User)
def sync_user_to_mongodb(sender, instance, created, **kwargs):
    role = instance.role
    if instance.is_superuser:
        role = "admin"

    user_data = {
        "sql_id": instance.id,
        "username": instance.username,
        "email": instance.email,
        "role": role,
        "xp_points": instance.xp_points,
        "streak_days": instance.streak_days,
        "profile_photo_url": instance.profile_photo_url,
        "banner_image_url": instance.banner_image_url,
        "bio": instance.bio,
        "is_premium": instance.is_premium,
        "premium_until": instance.premium_until.isoformat() if instance.premium_until else None,
    }
    
    if created:
        user_data["password"] = instance.password
        if not users_col.find_one({"username": instance.username}):
            users_col.insert_one(user_data)
    else:
        users_col.update_one(
            {"username": instance.username},
            {"$set": user_data},
            upsert=True
        )


class NotificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.token[:15]}..."


class NotificationInbox(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"To {self.user.username}: {self.title}"

