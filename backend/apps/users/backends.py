from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from config.mongodb import users_col

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None

        # Look up user in MongoDB "users" collection (supports case-insensitive check)
        mongo_user = users_col.find_one({
            "$or": [
                {"username": {"$regex": f"^{username}$", "$options": "i"}},
                {"email": {"$regex": f"^{username}$", "$options": "i"}}
            ]
        })

        if not mongo_user:
            return None

        db_password = mongo_user.get("password")
        if not db_password:
            return None

        password_matched = False
        plain_text_used = False
        
        # Support both Django hashed passwords and plain text test passwords in MongoDB
        if db_password.startswith("pbkdf2_sha256$") or db_password.startswith("bcrypt$") or db_password.startswith("argon2$"):
            password_matched = check_password(password, db_password)
        else:
            password_matched = (password == db_password)
            plain_text_used = True

        if password_matched:
            # Hash plain text password if detected
            if plain_text_used:
                hashed_password = make_password(password)
                users_col.update_one({"_id": mongo_user["_id"]}, {"$set": {"password": hashed_password}})
                db_password = hashed_password

            UserModel = get_user_model()
            sql_id = mongo_user.get("sql_id")
            user = None

            if sql_id is not None:
                try:
                    user = UserModel.objects.get(id=int(sql_id))
                except (UserModel.DoesNotExist, ValueError, TypeError):
                    pass

            if not user:
                # Try finding by username in SQLite
                try:
                    user = UserModel.objects.get(username=mongo_user["username"])
                except UserModel.DoesNotExist:
                    # Create shadow replica in SQLite to guarantee integer ID
                    user = UserModel.objects.create_user(
                        username=mongo_user["username"],
                        email=mongo_user.get("email", ""),
                        password=db_password
                    )
                # Update sql_id in MongoDB
                users_col.update_one({"_id": mongo_user["_id"]}, {"$set": {"sql_id": user.id}})

            # Attach MongoDB attributes dynamically to the user instance
            user.mongo_id = str(mongo_user["_id"])
            user.role = mongo_user.get("role", "student")
            user.xp_points = mongo_user.get("xp_points", 0)
            user.streak_days = mongo_user.get("streak_days", 0)
            user.profile_photo_url = mongo_user.get("profile_photo_url", "")
            user.banner_image_url = mongo_user.get("banner_image_url", "")
            user.bio = mongo_user.get("bio", "")
            user.is_banned = mongo_user.get("is_banned", False)
            user.is_active = not user.is_banned
            
            # Sync user's status flags to SQLite
            UserModel.objects.filter(id=user.id).update(
                email=user.email,
                is_active=user.is_active
            )
            
            return user

        return None
