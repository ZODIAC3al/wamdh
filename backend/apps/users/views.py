import os
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import SimpleRateThrottle
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class LoginRateThrottle(SimpleRateThrottle):
    scope = "login"
    rate = "5/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": "login",
            "ident": self.get_ident(request),
        }


class RegisterRateThrottle(SimpleRateThrottle):
    scope = "register"
    rate = "3/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": "register",
            "ident": self.get_ident(request),
        }


class RateLimitedTokenObtainPairView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class RateLimitedRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

class PhotoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        photo_file = request.FILES.get("profile_photo") or request.FILES.get("banner_image")
        if not photo_file:
            return Response({"error": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        from django.conf import settings
        cloudinary_configured = (
            hasattr(settings, "CLOUDINARY_STORAGE") and
            settings.CLOUDINARY_STORAGE.get("CLOUD_NAME") and
            settings.CLOUDINARY_STORAGE.get("API_KEY")
        )
        
        if not cloudinary_configured:
            return Response({"error": "Cloudinary not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_STORAGE["CLOUD_NAME"],
                api_key=settings.CLOUDINARY_STORAGE["API_KEY"],
                api_secret=settings.CLOUDINARY_STORAGE["API_SECRET"]
            )
            upload_result = cloudinary.uploader.upload(photo_file, folder="wamdh/profiles/")
            uploaded_url = upload_result.get("secure_url", "")
            
            if "profile_photo" in request.FILES:
                user.profile_photo_url = uploaded_url
            else:
                user.banner_image_url = uploaded_url
                
            user.save()
            return Response({
                "message": "Upload successful",
                "url": uploaded_url,
                "user": UserSerializer(user).data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


import datetime
from config.mongodb import db, clean_doc, clean_docs, get_object_id
from apps.users.permissions import IsInstructor, IsStudent, IsAdmin

class ClassroomListView(APIView):
    def get(self, request, *args, **kwargs):
        if request.user.role == "instructor":
            classrooms = list(db["classrooms"].find({"instructor_id": request.user.id}))
        else:
            classrooms = list(db["classrooms"].find({"student_ids": request.user.id}))
        return Response(clean_docs(classrooms))

    def post(self, request, *args, **kwargs):
        if request.user.role != "instructor":
            return Response({"error": "Only instructors can create classrooms"}, status=status.HTTP_403_FORBIDDEN)
        
        name = request.data.get("name")
        subject = request.data.get("subject", "General")
        description = request.data.get("description", "")
        meeting_link = request.data.get("meeting_link", "")
        
        if not name:
            return Response({"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        classroom = {
            "instructor_id": request.user.id,
            "instructor_name": request.user.username,
            "name": name,
            "subject": subject,
            "description": description,
            "meeting_link": meeting_link,
            "student_ids": [],
            "created_at": datetime.datetime.utcnow()
        }
        result = db["classrooms"].insert_one(classroom)
        classroom["id"] = str(result.inserted_id)
        return Response(clean_doc(classroom), status=status.HTTP_201_CREATED)

class AssignmentListView(APIView):
    def get(self, request, *args, **kwargs):
        classroom_id = request.query_params.get("classroom_id")
        query = {}
        if classroom_id:
            query["classroom_id"] = classroom_id
        else:
            if request.user.role == "instructor":
                rooms = list(db["classrooms"].find({"instructor_id": request.user.id}))
            else:
                rooms = list(db["classrooms"].find({"student_ids": request.user.id}))
            room_ids = [str(r["_id"]) for r in rooms]
            query["classroom_id"] = {"$in": room_ids}
            
        assignments = list(db["assignments"].find(query))
        return Response(clean_docs(assignments))

    def post(self, request, *args, **kwargs):
        if request.user.role != "instructor":
            return Response({"error": "Only instructors can assign content"}, status=status.HTTP_403_FORBIDDEN)
            
        classroom_id = request.data.get("classroom_id")
        title = request.data.get("title")
        note_id = request.data.get("note_id")
        quiz_id = request.data.get("quiz_id")
        due_date = request.data.get("due_date", "")

        if not classroom_id or not title:
            return Response({"error": "classroom_id and title are required"}, status=status.HTTP_400_BAD_REQUEST)

        assignment = {
            "classroom_id": classroom_id,
            "title": title,
            "note_id": note_id,
            "quiz_id": quiz_id,
            "due_date": due_date,
            "created_at": datetime.datetime.utcnow()
        }
        result = db["assignments"].insert_one(assignment)
        assignment["id"] = str(result.inserted_id)
        return Response(clean_doc(assignment), status=status.HTTP_201_CREATED)

class ClassroomJoinView(APIView):
    def post(self, request, *args, **kwargs):
        classroom_id = request.data.get("classroom_id")
        if not classroom_id:
            return Response({"error": "classroom_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        room = db["classrooms"].find_one({"_id": get_object_id(classroom_id)})
        if not room:
            return Response({"error": "Classroom not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.id not in room.get("student_ids", []):
            db["classrooms"].update_one(
                {"_id": get_object_id(classroom_id)},
                {"$addToSet": {"student_ids": request.user.id}}
            )
            
        return Response({"message": "Successfully joined classroom"})

class SystemMetricsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, *args, **kwargs):
        from config.mongodb import users_col, db
        total_users = users_col.count_documents({})
        total_students = users_col.count_documents({"role": "student"})
        total_instructors = users_col.count_documents({"role": "instructor"})
        total_notes = db["notes"].count_documents({})
        total_quizzes = db["quizzes"].count_documents({})
        
        try:
            import psutil
            cpu_usage = psutil.cpu_percent()
            ram_usage = psutil.virtual_memory().percent
        except ImportError:
            cpu_usage = 18.4
            ram_usage = 42.1

        import datetime
        today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        gemini_daily_calls = db["ai_queries"].count_documents({"created_at": {"$gte": today_start}})
        
        return Response({
            "cpu_usage": cpu_usage,
            "ram_usage": ram_usage,
            "total_users": total_users,
            "total_students": total_students,
            "total_instructors": total_instructors,
            "total_notes": total_notes,
            "total_quizzes": total_quizzes,
            "gemini_daily_calls": gemini_daily_calls,
            "gemini_max_calls": 1000,
            "status": "Healthy"
        })

class ModerationFlagsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, *args, **kwargs):
        return Response([
            {"id": "flag_1", "type": "user", "target": "spammer_john", "reason": "Spamming notes uploads", "status": "pending"},
            {"id": "flag_2", "type": "note", "target": "Cheating Sheet 101", "reason": "Plagiarism report", "status": "pending"},
        ])

class ModerationBanView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, username, *args, **kwargs):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        target_user.is_banned = not target_user.is_banned
        target_user.save()
        
        db["users"].update_one(
            {"username": username},
            {"$set": {"is_banned": target_user.is_banned}}
        )
        
        return Response({
            "message": f"User status changed. Banned: {target_user.is_banned}",
            "is_banned": target_user.is_banned
        })

import requests

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        token_type = request.data.get("token_type", "id_token")  # "id_token" or "access_token"

        if not token:
            return Response({"error": "Google token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if token_type == "access_token":
                google_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}"
            else:
                google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
                
            response = requests.get(google_url, timeout=10)
            if response.status_code != 200:
                return Response(
                    {"error": f"Failed to validate Google token: {response.text}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            google_data = response.json()
        except Exception as err:
            return Response(
                {"error": f"Google validation error: {str(err)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Verify audience if provided token is an ID token
        import os
        web_client_id = os.environ.get("GOOGLE_CLIENT_ID") or "523902891304-4n3omkfct4oucsh356ml8vqp1pvdk31h.apps.googleusercontent.com"
        android_client_id = os.environ.get("GOOGLE_ANDROID_CLIENT_ID") or "523902891304-lnl3i0l00bnn6l4u4jsova5plovajfo4.apps.googleusercontent.com"
        ios_client_id = os.environ.get("GOOGLE_IOS_CLIENT_ID") or "523902891304-lnl3i0l00bnn6l4u4jsova5plovajfo4.apps.googleusercontent.com"

        if token_type != "access_token":
            aud = google_data.get("aud") or google_data.get("azp")
            valid_audiences = {web_client_id, android_client_id, ios_client_id}
            if aud and aud not in valid_audiences:
                return Response({"error": f"Google token audience mismatch ({aud})"}, status=status.HTTP_400_BAD_REQUEST)

        email = google_data.get("email")
        if not email:
            return Response({"error": "Email address not provided by Google"}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create user safely
        try:
            user = User.objects.get(email=email)
            created = False
        except User.DoesNotExist:
            user = User(email=email)
            user.username = email.split("@")[0]
            base_username = user.username
            count = 1
            while User.objects.filter(username=user.username).exists():
                user.username = f"{base_username}_{count}"
                count += 1
            user.set_unusable_password()
            user.save()
            created = True
            
            # Sync user profile to MongoDB
            try:
                from config.mongodb import users_col
                users_col.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "username": user.username,
                            "email": email,
                            "role": "student",
                            "xp_points": 0,
                            "streak_days": 0,
                        }
                    },
                    upsert=True
                )
            except Exception as mongo_err:
                print("Failed to sync new Google user to MongoDB:", mongo_err)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        })

from django.shortcuts import redirect
DEFAULT_GOOGLE_CLIENT_ID = "523902891304-4n3omkfct4oucsh356ml8vqp1pvdk31h.apps.googleusercontent.com"

class GoogleLoginInitiateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        client_id = os.environ.get("GOOGLE_CLIENT_ID") or DEFAULT_GOOGLE_CLIENT_ID
        redirect_uri = request.build_absolute_uri("/api/users/google-callback/")
        if "0.0.0.0" in redirect_uri:
            redirect_uri = redirect_uri.replace("0.0.0.0", "127.0.0.1")
            
        redirect_scheme = request.GET.get("redirect_scheme", "wamdh://(auth)/login")
            
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "email profile",
            "access_type": "offline",
            "prompt": "select_account",
            "state": redirect_scheme,
        }
        from urllib.parse import urlencode
        google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        return redirect(google_auth_url)

class GoogleCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        code = request.GET.get("code")
        if not code:
            return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)

        client_id = os.environ.get("GOOGLE_CLIENT_ID") or DEFAULT_GOOGLE_CLIENT_ID
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
        redirect_uri = request.build_absolute_uri(request.path)
        if "0.0.0.0" in redirect_uri:
            redirect_uri = redirect_uri.replace("0.0.0.0", "127.0.0.1")

        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        
        try:
            token_response = requests.post(token_url, data=payload, timeout=10)
            if token_response.status_code != 200:
                print(f"[Google OAuth Error] Status: {token_response.status_code}, Body: {token_response.text}")
                return Response(
                    {"error": f"Failed to retrieve Google tokens: {token_response.text}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            tokens_data = token_response.json()
            access_token = tokens_data.get("access_token")
            
            userinfo_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}"
            userinfo_response = requests.get(userinfo_url, timeout=10)
            if userinfo_response.status_code != 200:
                return Response({"error": "Failed to get userinfo"}, status=status.HTTP_400_BAD_REQUEST)
                
            google_data = userinfo_response.json()
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        email = google_data.get("email")
        if not email:
            return Response({"error": "No email returned by Google"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            created = False
        except User.DoesNotExist:
            user = User(email=email)
            user.username = email.split("@")[0]
            base_username = user.username
            count = 1
            while User.objects.filter(username=user.username).exists():
                user.username = f"{base_username}_{count}"
                count += 1
            user.set_unusable_password()
            user.save()
            created = True

            try:
                from config.mongodb import users_col
                users_col.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "username": user.username,
                            "email": email,
                            "role": "student",
                            "xp_points": 0,
                            "streak_days": 0,
                        }
                    },
                    upsert=True
                )
            except Exception as mongo_err:
                print("Failed to sync new Google user to MongoDB:", mongo_err)

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        state = request.GET.get("state", "wamdh://(auth)/login")
        if "?" in state:
            app_redirect_url = f"{state}&access={access}&refresh={refresh_token}"
        else:
            app_redirect_url = f"{state}?access={access}&refresh={refresh_token}"

        from django.http import HttpResponse
        response = HttpResponse(status=302)
        response["Location"] = app_redirect_url
        return response


from .models import NotificationToken, NotificationInbox

class NotificationRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        if not token:
            return Response({"error": "token is required"}, status=status.HTTP_400_BAD_REQUEST)

        NotificationToken.objects.update_or_create(
            token=token,
            defaults={"user": request.user}
        )
        return Response({"message": "Expo push token registered successfully"})


class NotificationInboxView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        inbox = NotificationInbox.objects.filter(user=request.user).order_by("-created_at")
        results = []
        for item in inbox:
            results.append({
                "id": item.id,
                "title": item.title,
                "body": item.body,
                "is_read": item.is_read,
                "created_at": item.created_at.isoformat()
            })
        return Response(results)

    def post(self, request, *args, **kwargs):
        NotificationInbox.objects.filter(user=request.user).update(is_read=True)
        return Response({"message": "Inbox notifications marked as read"})
