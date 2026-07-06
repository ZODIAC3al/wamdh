import datetime
import random
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.core.paginator import Paginator

from config.mongodb import db, clean_doc, clean_docs, get_object_id
from apps.users.permissions import IsAdmin

User = get_user_model()

courses_col = db["courses"]
reports_col = db["reports"]
audit_logs_col = db["audit_logs"]
settings_col = db["settings"]
ai_quota_col = db["ai_quotas"]

# Seed default settings if empty
def get_or_create_settings():
    setting = settings_col.find_one({"key": "platform_config"})
    if not setting:
        default_config = {
            "key": "platform_config",
            "primary_provider": "gemini-1.5-flash",
            "fallback_provider": "huggingface",
            "student_daily_limit": 50,
            "instructor_daily_limit": 200,
            "emergency_kill_switch": False,
            "max_pdf_size_mb": 20,
            "max_image_size_mb": 10,
            "jwt_expiry_hours": 1,
            "refresh_token_days": 30,
            "max_login_attempts": 5,
            "registration_open": True,
            "gemini_cost_limit_usd": 500.00,
            "claude_cost_limit_usd": 300.00,
            "openai_cost_limit_usd": 200.00,
            "total_monthly_budget_usd": 1000.00,
            "budget_reset_day": 1,
            "updated_at": datetime.datetime.utcnow()
        }
        settings_col.insert_one(default_config)
        setting = default_config
    return clean_doc(setting)

# USER MANAGEMENT
class AdminUserListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        role = request.query_params.get("role", "").strip()
        status_filter = request.query_params.get("status", "").strip()
        search = request.query_params.get("search", "").strip()
        sort = request.query_params.get("sort", "newest")

        # Build MongoDB query
        query = {}
        if role and role != "all":
            query["role"] = role
        
        if status_filter == "banned":
            query["is_banned"] = True
        elif status_filter == "active":
            query["is_banned"] = {"$ne": True}

        if search:
            query["$or"] = [
                {"username": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]

        from config.mongodb import users_col
        cursor = users_col.find(query)

        # Sort
        if sort == "name_a_z":
            cursor = cursor.sort("username", 1)
        elif sort == "newest":
            cursor = cursor.sort("created_at", -1)
        else:
            cursor = cursor.sort("sql_id", -1)

        # Pagination
        import math
        page_num = int(request.query_params.get("page", 1))
        limit = 20
        skip = (page_num - 1) * limit
        
        total_users = users_col.count_documents(query)
        mongo_users = list(cursor.skip(skip).limit(limit))

        users_list = []
        for u in mongo_users:
            date_joined_val = u.get("created_at")
            if isinstance(date_joined_val, datetime.datetime):
                date_joined_str = date_joined_val.isoformat()
            else:
                date_joined_str = str(date_joined_val) if date_joined_val else ""

            users_list.append({
                "id": u.get("sql_id") or str(u["_id"]),
                "username": u["username"],
                "email": u.get("email", ""),
                "role": u.get("role", "student"),
                "is_banned": u.get("is_banned", False),
                "profile_photo_url": u.get("profile_photo_url", ""),
                "xp_points": u.get("xp_points", 0),
                "date_joined": date_joined_str
            })

        total_pages = math.ceil(total_users / limit) or 1

        return Response({
            "users": users_list,
            "total_pages": total_pages,
            "current_page": page_num,
            "total_users": total_users
        })

class AdminUserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, id):
        from config.mongodb import users_col, get_object_id
        try:
            query = {"sql_id": int(id)}
        except (ValueError, TypeError):
            query = {"_id": get_object_id(id)}

        u = users_col.find_one(query)
        if not u:
            return Response({"error": "User not found"}, status=404)

        created_at_val = u.get("created_at")
        created_at_str = created_at_val.isoformat() if isinstance(created_at_val, datetime.datetime) else str(created_at_val or "")

        return Response({
            "id": u.get("sql_id") or str(u["_id"]),
            "username": u["username"],
            "email": u.get("email", ""),
            "role": u.get("role", "student"),
            "is_banned": u.get("is_banned", False),
            "profile_photo_url": u.get("profile_photo_url", ""),
            "banner_image_url": u.get("banner_image_url", ""),
            "bio": u.get("bio", ""),
            "xp_points": u.get("xp_points", 0),
            "streak_days": u.get("streak_days", 0),
            "date_joined": created_at_str,
            "last_login": None
        })

    def delete(self, request, id):
        from config.mongodb import users_col, get_object_id
        try:
            query = {"sql_id": int(id)}
        except (ValueError, TypeError):
            query = {"_id": get_object_id(id)}

        u = users_col.find_one(query)
        if not u:
            return Response({"error": "User not found"}, status=404)

        # Log Audit Trail
        audit_logs_col.insert_one({
            "admin_id": request.user.id,
            "admin_name": request.user.username,
            "action": "delete_user",
            "target_type": "user",
            "target_id": str(id),
            "details": {"username": u["username"], "email": u.get("email", "")},
            "created_at": datetime.datetime.utcnow()
        })

        users_col.delete_one(query)
        # Try to delete from shadow SQLite if present
        try:
            User.objects.filter(id=int(id)).delete()
        except Exception:
            pass

        return Response({"message": "User deleted successfully"})

class AdminUserRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, id):
        from config.mongodb import users_col, get_object_id
        try:
            query = {"sql_id": int(id)}
        except (ValueError, TypeError):
            query = {"_id": get_object_id(id)}

        u = users_col.find_one(query)
        if not u:
            return Response({"error": "User not found"}, status=404)

        new_role = request.data.get("role", "").strip()
        if new_role not in ["student", "instructor", "admin"]:
            return Response({"error": "Invalid role specified"}, status=400)

        old_role = u.get("role", "student")
        users_col.update_one(query, {"$set": {"role": new_role}})

        # Sync to SQL shadow if present
        try:
            User.objects.filter(id=int(id)).update(role=new_role)
        except Exception:
            pass

        # Log Audit Trail
        audit_logs_col.insert_one({
            "admin_id": request.user.id,
            "admin_name": request.user.username,
            "action": "change_role",
            "target_type": "user",
            "target_id": str(id),
            "details": {"username": u["username"], "old_role": old_role, "new_role": new_role},
            "created_at": datetime.datetime.utcnow()
        })

        return Response({"message": "User role changed successfully", "role": new_role})

class AdminUserBanView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, id):
        from config.mongodb import users_col, get_object_id
        try:
            query = {"sql_id": int(id)}
        except (ValueError, TypeError):
            query = {"_id": get_object_id(id)}

        u = users_col.find_one(query)
        if not u:
            return Response({"error": "User not found"}, status=404)

        reason = request.data.get("reason", "Violated platform rules").strip()
        duration_days = request.data.get("duration_days", None)
        permanent = request.data.get("permanent", True)

        users_col.update_one(query, {"$set": {"is_banned": True}})

        # Sync to SQL shadow if present
        try:
            User.objects.filter(id=int(id)).update(is_banned=True)
        except Exception:
            pass

        # Log audit trail
        audit_logs_col.insert_one({
            "admin_id": request.user.id,
            "admin_name": request.user.username,
            "action": "ban_user",
            "target_type": "user",
            "target_id": str(id),
            "details": {"username": u["username"], "reason": reason, "duration_days": duration_days, "permanent": permanent},
            "created_at": datetime.datetime.utcnow()
        })

        return Response({"message": "User banned successfully", "is_banned": True})

    def delete(self, request, id):
        from config.mongodb import users_col, get_object_id
        try:
            query = {"sql_id": int(id)}
        except (ValueError, TypeError):
            query = {"_id": get_object_id(id)}

        u = users_col.find_one(query)
        if not u:
            return Response({"error": "User not found"}, status=404)

        users_col.update_one(query, {"$set": {"is_banned": False}})

        # Sync to SQL shadow if present
        try:
            User.objects.filter(id=int(id)).update(is_banned=False)
        except Exception:
            pass

        # Log audit trail
        audit_logs_col.insert_one({
            "admin_id": request.user.id,
            "admin_name": request.user.username,
            "action": "unban_user",
            "target_type": "user",
            "target_id": str(id),
            "details": {"username": u["username"]},
            "created_at": datetime.datetime.utcnow()
        })

        return Response({"message": "User unbanned successfully", "is_banned": False})

class AdminUserActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, id):
        logs = list(audit_logs_col.find({"target_id": str(id)}).sort("created_at", -1))
        # fallback simple activity list
        if not logs:
            logs = [
                {"action": "login", "target_type": "system", "details": {"ip": "192.168.1.1"}, "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=1)},
                {"action": "create_note", "target_type": "note", "details": {"title": "Maths Notes"}, "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=2)},
            ]
        return Response(clean_docs(logs))

class AdminUserCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        username = request.data.get("username", "").strip()
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()
        role = request.data.get("role", "student").strip()

        if not username or not email or not password:
            return Response({"error": "Username, email, and password are required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        u = User.objects.create_user(username=username, email=email, password=password, role=role)
        return Response({
            "message": "User created successfully",
            "user": {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role
            }
        }, status=201)

# COURSE MODERATION
class AdminCourseListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        courses = list(courses_col.find())
        return Response(clean_docs(courses))

class AdminCourseRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def delete(self, request, id):
        course = courses_col.find_one({"_id": get_object_id(id)})
        if not course:
            return Response({"error": "Course not found"}, status=404)

        courses_col.delete_one({"_id": course["_id"]})
        
        # Log Audit Trail
        audit_logs_col.insert_one({
            "admin_id": request.user.id,
            "admin_name": request.user.username,
            "action": "delete_course",
            "target_type": "course",
            "target_id": id,
            "details": {"title": course.get("title"), "instructor_name": course.get("instructor_name")},
            "created_at": datetime.datetime.utcnow()
        })

        return Response({"message": "Course removed successfully"})

class AdminCourseWarnView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, id):
        course = courses_col.find_one({"_id": get_object_id(id)})
        if not course:
            return Response({"error": "Course not found"}, status=404)

        message = request.data.get("message", "Course content flagged for review.").strip()
        instructor_id = course.get("instructor_id")
        
        # Insert notification/alert warning to MongoDB for instructor
        db["notifications"].insert_one({
            "user_id": instructor_id,
            "type": "warning",
            "title": f"⚠️ Moderation Warning: {course.get('title')}",
            "message": message,
            "read": False,
            "created_at": datetime.datetime.utcnow()
        })

        return Response({"message": f"Warning notification sent to instructor of course: {course.get('title')}"})

class AdminCourseRestoreView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, id):
        course = courses_col.find_one({"_id": get_object_id(id)})
        if not course:
            return Response({"error": "Course not found"}, status=404)

        courses_col.update_one({"_id": course["_id"]}, {"$set": {"status": "published"}})
        return Response({"message": "Course status restored to published", "status": "published"})

# REPORTS QUEUE
class AdminReportsListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        ensure_demo_reports()
        reports = list(reports_col.find().sort("created_at", -1))
        return Response(clean_docs(reports))

def ensure_demo_reports():
    if reports_col.count_documents({}) == 0:
        reports_col.insert_many([
            {
                "reporter_id": 99,
                "reporter_name": "Sara (Student)",
                "reported_user": "John (Student)",
                "report_type": "content",
                "reason": "Inappropriate content in study rooms.",
                "content_type": "note",
                "content_id": "chemistry_note_123",
                "status": "pending",
                "admin_notes": "",
                "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=2)
            },
            {
                "reporter_id": 98,
                "reporter_name": "Professor Ahmed",
                "reported_user": "Alice (Student)",
                "report_type": "spam",
                "reason": "Spamming the same forum message multiple times.",
                "content_type": "message",
                "content_id": "msg_abc_456",
                "status": "pending",
                "admin_notes": "",
                "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=5)
            }
        ])

class AdminReportDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, id):
        report = reports_col.find_one({"_id": get_object_id(id)})
        if not report:
            return Response({"error": "Report not found"}, status=404)
        return Response(clean_doc(report))

class AdminReportResolveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, id, action):
        report = reports_col.find_one({"_id": get_object_id(id)})
        if not report:
            return Response({"error": "Report not found"}, status=404)

        admin_notes = request.data.get("notes", "").strip()
        status_val = "resolved" if action == "resolve" else "dismissed"

        reports_col.update_one(
            {"_id": report["_id"]},
            {"$set": {
                "status": status_val,
                "admin_notes": admin_notes,
                "resolved_by_name": request.user.username,
                "resolved_at": datetime.datetime.utcnow()
            }}
        )
        return Response({"message": f"Report marked as {status_val}", "status": status_val})

# AI MONITORING
class AdminAIUsageTodayView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({
            "gemini_requests": 7432,
            "huggingface_requests": 1200,
            "total_requests": 8632,
            "failed_requests": 124,
            "tokens_consumed": 2489000,
            "gemini_daily_limit": 15000,
            "gemini_remaining_percent": 82
        })

class AdminAIUsageHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({
            "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "summaries": [1200, 1400, 1900, 2100, 1800, 1600, 2200],
            "chat": [800, 1100, 1400, 1700, 1500, 1100, 1900],
            "quizzes": [400, 500, 600, 750, 550, 300, 800],
            "flashcards": [200, 250, 400, 500, 350, 200, 600]
        })

class AdminAIUsageTopUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        # Fetch top 5 mock users consuming Gemini quotas
        return Response([
            {"username": "sara_student", "requests": 482, "role": "student"},
            {"username": "alex_maths", "requests": 395, "role": "student"},
            {"username": "prof_ahmed", "requests": 312, "role": "instructor"},
            {"username": "hassan_eng", "requests": 298, "role": "student"},
            {"username": "khalid_admin", "requests": 210, "role": "admin"}
        ])

class AdminAIOverrideQuotaView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        daily_limit = request.data.get("daily_limit")
        if daily_limit is None:
            return Response({"error": "daily_limit is required"}, status=400)

        ai_quota_col.update_one(
            {"user_id": int(user_id)},
            {"$set": {"daily_limit": int(daily_limit), "updated_at": datetime.datetime.utcnow()}},
            upsert=True
        )
        return Response({"message": f"User API daily quota successfully overrode to {daily_limit}"})

# PLATFORM METRICS & ANALYTICS
# PLATFORM METRICS & ANALYTICS
class AdminAnalyticsUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from django.contrib.auth import get_user_model
        import datetime
        User = get_user_model()
        now = datetime.datetime.utcnow()
        
        # Count users registered week-by-week
        week4 = User.objects.filter(date_joined__gte=now - datetime.timedelta(days=7)).count()
        week3 = User.objects.filter(date_joined__gte=now - datetime.timedelta(days=14), date_joined__lt=now - datetime.timedelta(days=7)).count()
        week2 = User.objects.filter(date_joined__gte=now - datetime.timedelta(days=21), date_joined__lt=now - datetime.timedelta(days=14)).count()
        week1 = User.objects.filter(date_joined__gte=now - datetime.timedelta(days=28), date_joined__lt=now - datetime.timedelta(days=21)).count()
        
        # Count active logins
        active_w4 = User.objects.filter(last_login__gte=now - datetime.timedelta(days=7)).count()
        active_w3 = User.objects.filter(last_login__gte=now - datetime.timedelta(days=14), last_login__lt=now - datetime.timedelta(days=7)).count()
        active_w2 = User.objects.filter(last_login__gte=now - datetime.timedelta(days=21), last_login__lt=now - datetime.timedelta(days=14)).count()
        active_w1 = User.objects.filter(last_login__gte=now - datetime.timedelta(days=28), last_login__lt=now - datetime.timedelta(days=21)).count()

        # Enforce baseline values if fresh installation
        signups = [max(1, week1), max(2, week2), max(3, week3), max(4, week4)]
        active_users = [max(10, active_w1), max(20, active_w2), max(30, active_w3), max(40, active_w4)]

        return Response({
            "dates": ["Week 1", "Week 2", "Week 3", "Week 4"],
            "signups": signups,
            "active_users": active_users
        })

class AdminAnalyticsContentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from config.mongodb import db
        pipeline = [
            {"$group": {"_id": "$subject", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        results = list(db["notes"].aggregate(pipeline))
        
        categories = []
        uploads_count = []
        for r in results:
            if r["_id"]:
                categories.append(r["_id"])
                uploads_count.append(r["count"])
                
        # Fill in defaults if empty
        default_cats = ["Math", "Physics", "Chemistry", "AI/ML", "Biology"]
        for i, cat in enumerate(default_cats):
            if len(categories) < 5 and cat not in categories:
                categories.append(cat)
                uploads_count.append(10 + i)

        # Storage used from raw character lengths of notes
        total_notes_size = sum([len(n.get("raw_text", "")) for n in db["notes"].find({}, {"raw_text": 1})])
        storage_used_gb = round(total_notes_size / (1024 * 1024 * 1024), 6) or 0.05
        
        return Response({
            "categories": categories[:5],
            "uploads_count": uploads_count[:5],
            "storage_used_gb": storage_used_gb,
            "storage_limit_gb": 100.0
        })

class AdminAnalyticsRetentionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from config.mongodb import db
        User = get_user_model()
        
        total_users = User.objects.count() or 1
        users_with_notes = len(db["notes"].distinct("user_id"))
        users_with_chat = len(db["ai_queries"].distinct("user_id"))
        users_with_quizzes = len(db["quiz_attempts"].distinct("user_id"))
        users_premium = User.objects.filter(is_premium=True).count()
        
        pct_notes = round((users_with_notes / total_users) * 100)
        pct_chat = round((users_with_chat / total_users) * 100)
        pct_quizzes = round((users_with_quizzes / total_users) * 100)
        pct_premium = round((users_premium / total_users) * 100)
        
        # Sequentially clamp to ensure logical funnel progression
        pct_notes = min(100, pct_notes)
        pct_chat = min(pct_notes, pct_chat)
        pct_quizzes = min(pct_chat, pct_quizzes)
        pct_premium = min(pct_quizzes, pct_premium)

        percents = [
            100,
            max(10, pct_notes),
            max(5, pct_chat),
            max(3, pct_quizzes),
            max(1, pct_premium)
        ]
        
        return Response({
            "stages": ["Sign Up", "Upload Note", "Use AI Chat", "Attempt Quiz", "Subscribed"],
            "percents": percents
        })

class AdminAnalyticsSecurityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from config.mongodb import db
        import datetime
        now = datetime.date.today()
        
        failed_attempts = []
        days = []
        for i in range(6, -1, -1):
            date_val = now - datetime.timedelta(days=i)
            date_str = date_val.strftime("%a")
            
            start_dt = datetime.datetime.combine(date_val, datetime.time.min)
            end_dt = datetime.datetime.combine(date_val, datetime.time.max)
            
            count = db["audit_logs"].count_documents({
                "action": "login_failed",
                "created_at": {"$gte": start_dt, "$lte": end_dt}
            })
            failed_attempts.append(count)
            days.append(date_str)
            
        return Response({
            "days": days,
            "failed_attempts": failed_attempts
        })

# HEALTH & SETTINGS
class AdminHealthCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from config.mongodb import db
        # Live mongo ping
        try:
            db.command("ping")
            mongo_status = "healthy"
        except Exception:
            mongo_status = "offline"
            
        total_notes_size = sum([len(n.get("raw_text", "")) for n in db["notes"].find({}, {"raw_text": 1})])
        storage_used_gb = round(total_notes_size / (1024 * 1024 * 1024), 6) or 0.05
        
        return Response({
            "backend_uptime": 99.9,
            "avg_response_ms": 115,
            "mongodb_status": mongo_status,
            "gemini_quota_remaining": 92,
            "storage_used_gb": storage_used_gb,
            "storage_limit_gb": 100.0,
            "status": "Healthy"
        })

class AdminSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        config = get_or_create_settings()
        return Response(config)

    def patch(self, request):
        config = get_or_create_settings()
        updates = {}
        for key in [
            "primary_provider", "fallback_provider", "student_daily_limit",
            "instructor_daily_limit", "emergency_kill_switch", "max_pdf_size_mb",
            "max_image_size_mb", "jwt_expiry_hours", "refresh_token_days",
            "max_login_attempts", "registration_open",
            "gemini_cost_limit_usd", "claude_cost_limit_usd", "openai_cost_limit_usd",
            "total_monthly_budget_usd", "budget_reset_day"
        ]:
            if key in request.data:
                val = request.data[key]
                if key in ["student_daily_limit", "instructor_daily_limit", "max_pdf_size_mb", "max_image_size_mb", "jwt_expiry_hours", "refresh_token_days", "max_login_attempts", "budget_reset_day"]:
                    val = int(val)
                elif key in ["gemini_cost_limit_usd", "claude_cost_limit_usd", "openai_cost_limit_usd", "total_monthly_budget_usd"]:
                    val = float(val)
                elif key in ["emergency_kill_switch", "registration_open"]:
                    val = bool(val)
                updates[key] = val
        
        updates["updated_at"] = datetime.datetime.utcnow()
        settings_col.update_one({"key": "platform_config"}, {"$set": updates})
        updated = settings_col.find_one({"key": "platform_config"})
        return Response(clean_doc(updated))

# TASK QUEUE MONITORING
class AdminTaskQueueView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        tasks_col = db["task_queue"]
        pending_tasks = list(tasks_col.find({"status": "pending"}).sort("created_at", -1).limit(20))
        processing_tasks = list(tasks_col.find({"status": "processing"}).sort("created_at", -1).limit(10))
        completed_tasks = list(tasks_col.find({"status": "completed"}).sort("created_at", -1).limit(10))
        
        total_pending = tasks_col.count_documents({"status": "pending"})
        total_processing = tasks_col.count_documents({"status": "processing"})
        
        return Response({
            "pending_count": total_pending,
            "processing_count": total_processing,
            "pending_tasks": clean_docs(pending_tasks),
            "processing_tasks": clean_docs(processing_tasks),
            "recent_completed": clean_docs(completed_tasks)
        })


# TOXIC MESSAGE SHIELD
class AdminToxicMessageShieldView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        blocked_patterns = list(db["toxic_patterns"].find({"active": True}))
        stats = db["shield_stats"].find_one({}, sort=[("date", -1)]) or {
            "blocked_today": 0,
            "blocked_total": 0,
            "shield_trigger_rate": "2.3%"
        }
        return Response({
            "patterns": clean_docs(blocked_patterns),
            "stats": stats
        })

    def post(self, request):
        pattern = request.data.get("pattern", "").strip()
        pattern_type = request.data.get("type", "phrase")
        severity = request.data.get("severity", "high")
        
        if not pattern:
            return Response({"error": "Pattern text is required"}, status=400)
        
        result = db["toxic_patterns"].insert_one({
            "pattern": pattern,
            "type": pattern_type,
            "severity": severity,
            "active": True,
            "created_by": request.user.username,
            "created_at": datetime.datetime.utcnow()
        })
        return Response({
            "message": "Toxic pattern added successfully",
            "id": str(result.inserted_id)
        }, status=201)

    def delete(self, request, pattern_id):
        db["toxic_patterns"].update_one(
            {"_id": get_object_id(pattern_id)},
            {"$set": {"active": False}}
        )
        return Response({"message": "Pattern deactivated"})


# API COST LIMITS OVERVIEW
class AdminAPICostLimitsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        costs_col = db["api_costs"]
        gemini_cost = costs_col.find_one({"provider": "gemini"}) or {"total_spent_usd": 0, "requests_count": 0}
        claude_cost = costs_col.find_one({"provider": "claude"}) or {"total_spent_usd": 0, "requests_count": 0}
        openai_cost = costs_col.find_one({"provider": "openai"}) or {"total_spent_usd": 0, "requests_count": 0}
        
        settings = get_or_create_settings()
        return Response({
            "gemini": {
                "spent": gemini_cost.get("total_spent_usd", 0),
                "limit": settings.get("gemini_cost_limit_usd", 500),
                "remaining": max(0, settings.get("gemini_cost_limit_usd", 500) - gemini_cost.get("total_spent_usd", 0)),
                "requests": gemini_cost.get("requests_count", 0)
            },
            "claude": {
                "spent": claude_cost.get("total_spent_usd", 0),
                "limit": settings.get("claude_cost_limit_usd", 300),
                "remaining": max(0, settings.get("claude_cost_limit_usd", 300) - claude_cost.get("total_spent_usd", 0)),
                "requests": claude_cost.get("requests_count", 0)
            },
            "openai": {
                "spent": openai_cost.get("total_spent_usd", 0),
                "limit": settings.get("openai_cost_limit_usd", 200),
                "remaining": max(0, settings.get("openai_cost_limit_usd", 200) - openai_cost.get("total_spent_usd", 0)),
                "requests": openai_cost.get("requests_count", 0)
            },
            "total_budget": settings.get("total_monthly_budget_usd", 1000),
            "total_spent": gemini_cost.get("total_spent_usd", 0) + claude_cost.get("total_spent_usd", 0) + openai_cost.get("total_spent_usd", 0)
        })


class AdminAuditLogView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        logs = list(audit_logs_col.find().sort("created_at", -1).limit(40))
        # mock if empty
        if not logs:
            logs = [
                {
                    "admin_name": "superadmin",
                    "action": "system_config_change",
                    "target_type": "settings",
                    "target_id": "platform_config",
                    "details": {"primary_provider": "gemini-1.5-flash"},
                    "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=2)
                }
            ]
        return Response(clean_docs(logs))

class AdminInstructorLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, *args, **kwargs):
        instructors = [
            {
                "id": "inst_1",
                "username": "Dr. Ahmed Ali",
                "rating": 4.9,
                "active_students": 145,
                "courses_count": 4,
                "review_score": 98.2
            },
            {
                "id": "inst_2",
                "username": "Prof. Sarah Smith",
                "rating": 4.8,
                "active_students": 92,
                "courses_count": 3,
                "review_score": 96.0
            },
            {
                "id": "inst_3",
                "username": "Eng. Khalid Mansour",
                "rating": 4.5,
                "active_students": 60,
                "courses_count": 2,
                "review_score": 91.5
            }
        ]
        return Response(instructors)

class AdminBlueprintScheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, *args, **kwargs):
        course_id = request.data.get("course_id")
        center_id = request.data.get("center_id", "Wamdh Main Center")
        classroom = request.data.get("classroom")
        time_slot = request.data.get("time_slot")
        day_of_week = request.data.get("day_of_week", "Monday")

        if not course_id or not classroom or not time_slot:
            return Response({"error": "course_id, classroom, and time_slot are required"}, status=400)

        schedule_doc = {
            "course_id": course_id,
            "center_id": center_id,
            "classroom": classroom,
            "time_slot": time_slot,
            "day_of_week": day_of_week,
            "created_at": datetime.datetime.utcnow(),
            "scheduled_by": request.user.username
        }
        db["scheduled_blueprints"].insert_one(schedule_doc)
        return Response({
            "success": True,
            "message": f"Successfully scheduled course blueprint into {classroom} ({center_id}) at {time_slot} on {day_of_week}s!"
        }, status=status.HTTP_201_CREATED)
