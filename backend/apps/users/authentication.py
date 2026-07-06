from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth import get_user_model
from config.mongodb import users_col, get_object_id
from datetime import datetime

class MongoDBJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")

        # Query MongoDB users collection using the SQL ID from the token
        try:
            mongo_user = users_col.find_one({"sql_id": int(user_id)})
        except (ValueError, TypeError):
            mongo_user = None

        if not mongo_user:
            # Fallback to _id search
            mongo_user = users_col.find_one({"_id": get_object_id(user_id)})
            
        # If not found by _id, check username as a backup (useful for legacy or newly created accounts)
        if not mongo_user:
            username = validated_token.get("username", "")
            if username:
                mongo_user = users_col.find_one({"username": username})

        if not mongo_user:
            raise AuthenticationFailed("User not found", code="user_not_found")

        if mongo_user.get("is_banned", False):
            raise AuthenticationFailed("User is banned", code="user_banned")

        # Ensure we always get/create a valid integer ID matching SQLite database
        UserModel = get_user_model()
        user_id_val = mongo_user.get("sql_id")
        user = None

        if user_id_val is not None:
            try:
                user = UserModel.objects.get(id=int(user_id_val))
            except (UserModel.DoesNotExist, ValueError, TypeError):
                pass

        if not user:
            try:
                user = UserModel.objects.get(username=mongo_user["username"])
            except UserModel.DoesNotExist:
                user = UserModel.objects.create_user(
                    username=mongo_user["username"],
                    email=mongo_user.get("email", ""),
                    password=mongo_user.get("password", "dummy_shadow")
                )
            users_col.update_one({"_id": mongo_user["_id"]}, {"$set": {"sql_id": user.id}})

        prem_until = mongo_user.get("premium_until")
        parsed_until = None
        if prem_until:
            try:
                parsed_until = datetime.fromisoformat(prem_until)
            except Exception:
                pass

        # Dynamically attach MongoDB attributes to user instance
        user.mongo_id = str(mongo_user["_id"])
        user.role = mongo_user.get("role", "student")
        user.xp_points = mongo_user.get("xp_points", 0)
        user.streak_days = mongo_user.get("streak_days", 0)
        user.profile_photo_url = mongo_user.get("profile_photo_url", "")
        user.banner_image_url = mongo_user.get("banner_image_url", "")
        user.bio = mongo_user.get("bio", "")
        user.is_banned = mongo_user.get("is_banned", False)
        user.is_premium = mongo_user.get("is_premium", False)
        user.premium_until = parsed_until
        
        # Necessary flags for Django auth permissions
        user.is_active = not user.is_banned
        
        # Sync user status to SQLite database
        UserModel.objects.filter(id=user.id).update(
            email=user.email,
            is_active=user.is_active
        )
        
        return user
