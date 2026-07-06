from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RateLimitedRegisterView, RateLimitedTokenObtainPairView, UserProfileView, 
    UserDetailView, PhotoUploadView, ClassroomListView, ClassroomJoinView,
    AssignmentListView, SystemMetricsView, ModerationFlagsView, ModerationBanView,
    GoogleLoginView, GoogleLoginInitiateView, GoogleCallbackView,
    NotificationRegisterView, NotificationInboxView
)
from . import instructor_views
from . import admin_views

urlpatterns = [
    path("register/", RateLimitedRegisterView.as_view(), name="auth_register"),
    path("login/", RateLimitedTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("google-login/", GoogleLoginView.as_view(), name="google_login"),
    path("google-login-initiate/", GoogleLoginInitiateView.as_view(), name="google_login_initiate"),
    path("google-callback/", GoogleCallbackView.as_view(), name="google_callback"),

    # Profile endpoints
    path("", UserProfileView.as_view(), name="user_profile_default"),
    path("profile/", UserProfileView.as_view(), name="user_profile"),
    path("profile/photo/", PhotoUploadView.as_view(), name="profile_photo_upload"),
    path("profile/banner/", PhotoUploadView.as_view(), name="banner_photo_upload"),
    path("profile/<int:id>/", UserDetailView.as_view(), name="user_detail"),

    # Classroom & Assignments (existing)
    path("classrooms/", ClassroomListView.as_view(), name="classrooms_list"),
    path("classrooms/join/", ClassroomJoinView.as_view(), name="classroom_join"),
    path("assignments/", AssignmentListView.as_view(), name="assignments_list"),

    # Admin Operations (existing fallback)
    path("admin/metrics/", SystemMetricsView.as_view(), name="admin_metrics"),
    path("admin/flags/", ModerationFlagsView.as_view(), name="admin_flags"),
    path("admin/ban/<str:username>/", ModerationBanView.as_view(), name="admin_ban"),

    # --- INSTRUCTOR API ENDPOINTS ---
    path("instructor/courses/", instructor_views.CourseListCreateView.as_view(), name="inst_courses"),
    path("instructor/courses/<str:id>/", instructor_views.CourseDetailView.as_view(), name="inst_course_detail"),
    path("instructor/courses/<str:id>/thumbnail/", instructor_views.CourseThumbnailView.as_view(), name="inst_course_thumb"),
    path("instructor/courses/<str:id>/<str:action>/", instructor_views.CoursePublishView.as_view(), name="inst_course_publish"),
    
    path("instructor/courses/<str:id>/chapters/", instructor_views.ChapterListCreateView.as_view(), name="inst_chapters"),
    path("instructor/courses/<str:id>/chapters/reorder/", instructor_views.ChapterReorderView.as_view(), name="inst_chapters_reorder"),
    path("instructor/courses/<str:id>/chapters/<str:cid>/", instructor_views.ChapterDetailView.as_view(), name="inst_chapter_detail"),
    path("instructor/courses/<str:id>/chapters/<str:cid>/<str:action>/", instructor_views.ChapterLockUnlockView.as_view(), name="inst_chapter_lock"),
    
    path("instructor/chapters/<str:cid>/materials/", instructor_views.MaterialListCreateView.as_view(), name="inst_materials"),
    path("instructor/materials/<str:mid>/", instructor_views.MaterialDetailView.as_view(), name="inst_material_detail"),
    path("instructor/materials/<str:mid>/ai-summary/", instructor_views.MaterialAISummaryView.as_view(), name="inst_material_ai_summary"),
    
    path("instructor/students/", instructor_views.StudentListView.as_view(), name="inst_students"),
    path("instructor/students/at-risk/", instructor_views.AtRiskStudentListView.as_view(), name="inst_students_at_risk"),
    path("instructor/students/<int:id>/", instructor_views.StudentDetailView.as_view(), name="inst_student_detail"),
    path("instructor/courses/<str:id>/students/", instructor_views.CourseStudentListView.as_view(), name="inst_course_students"),
    
    path("instructor/courses/<str:id>/quizzes/", instructor_views.CourseQuizListView.as_view(), name="inst_course_quizzes"),
    path("instructor/quizzes/", instructor_views.QuizCreateView.as_view(), name="inst_quiz_create"),
    path("instructor/quizzes/generate/", instructor_views.QuizGenerateView.as_view(), name="inst_quiz_generate"),
    path("instructor/quizzes/<str:id>/", instructor_views.QuizDetailView.as_view(), name="inst_quiz_detail"),
    path("instructor/quizzes/<str:id>/submissions/", instructor_views.QuizSubmissionsView.as_view(), name="inst_quiz_subs"),
    path("instructor/quizzes/<str:id>/assign/", instructor_views.QuizAssignView.as_view(), name="inst_quiz_assign"),
    
    path("instructor/announcements/", instructor_views.AnnouncementListCreateView.as_view(), name="inst_announcements"),
    path("instructor/announcements/<str:id>/", instructor_views.AnnouncementDetailView.as_view(), name="inst_announcement_detail"),
    path("instructor/submissions/", instructor_views.InstructorSubmissionsView.as_view(), name="inst_submissions"),
    path("instructor/submissions/<str:id>/grade/", instructor_views.InstructorSubmissionsGradeView.as_view(), name="inst_submissions_grade"),
    
    path("instructor/analytics/overview/", instructor_views.InstructorAnalyticsOverview.as_view(), name="inst_analytics_over"),
    path("instructor/analytics/courses/", instructor_views.InstructorAnalyticsCourses.as_view(), name="inst_analytics_courses"),
    path("instructor/analytics/students/", instructor_views.InstructorAnalyticsStudents.as_view(), name="inst_analytics_students"),
    path("instructor/analytics/quizzes/", instructor_views.InstructorAnalyticsQuizzes.as_view(), name="inst_analytics_quizzes"),
    path("instructor/analytics/ai-insights/", instructor_views.InstructorAnalyticsAIInsights.as_view(), name="inst_analytics_ai"),
    path("instructor/analytics/engagement/", instructor_views.InstructorAnalyticsEngagement.as_view(), name="inst_analytics_engage"),
    path("instructor/analytics/activity/", instructor_views.InstructorRecentActivityView.as_view(), name="inst_analytics_activity"),

    # --- ADMIN API ENDPOINTS ---
    path("admin/users/", admin_views.AdminUserListView.as_view(), name="adm_users"),
    path("admin/users/create/", admin_views.AdminUserCreateView.as_view(), name="adm_user_create"),
    path("admin/users/<int:id>/", admin_views.AdminUserDetailView.as_view(), name="adm_user_detail"),
    path("admin/users/<int:id>/role/", admin_views.AdminUserRoleView.as_view(), name="adm_user_role"),
    path("admin/users/<int:id>/ban/", admin_views.AdminUserBanView.as_view(), name="adm_user_ban"),
    path("admin/users/<int:id>/activity/", admin_views.AdminUserActivityView.as_view(), name="adm_user_activity"),
    
    path("admin/courses/", admin_views.AdminCourseListView.as_view(), name="adm_courses"),
    path("admin/courses/<str:id>/", admin_views.AdminCourseRemoveView.as_view(), name="adm_course_remove"),
    path("admin/courses/<str:id>/warn/", admin_views.AdminCourseWarnView.as_view(), name="adm_course_warn"),
    path("admin/courses/<str:id>/restore/", admin_views.AdminCourseRestoreView.as_view(), name="adm_course_restore"),
    
    path("admin/reports/", admin_views.AdminReportsListView.as_view(), name="adm_reports"),
    path("admin/reports/<str:id>/", admin_views.AdminReportDetailView.as_view(), name="adm_report_detail"),
    path("admin/reports/<str:id>/<str:action>/", admin_views.AdminReportResolveView.as_view(), name="adm_report_resolve"),
    
    path("admin/ai/usage/today/", admin_views.AdminAIUsageTodayView.as_view(), name="adm_ai_today"),
    path("admin/ai/usage/history/", admin_views.AdminAIUsageHistoryView.as_view(), name="adm_ai_history"),
    path("admin/ai/usage/top-users/", admin_views.AdminAIUsageTopUsersView.as_view(), name="adm_ai_top_users"),
    path("admin/ai/quota/<int:user_id>/", admin_views.AdminAIOverrideQuotaView.as_view(), name="adm_ai_quota_override"),
    
    path("admin/analytics/users/", admin_views.AdminAnalyticsUsersView.as_view(), name="adm_analytics_users"),
    path("admin/analytics/content/", admin_views.AdminAnalyticsContentView.as_view(), name="adm_analytics_content"),
    path("admin/analytics/retention/", admin_views.AdminAnalyticsRetentionView.as_view(), name="adm_analytics_retention"),
    path("admin/analytics/security/", admin_views.AdminAnalyticsSecurityView.as_view(), name="adm_analytics_security"),
    
    path("admin/health/", admin_views.AdminHealthCheckView.as_view(), name="adm_health"),
    path("admin/settings/", admin_views.AdminSettingsView.as_view(), name="adm_settings"),
    path("admin/audit-log/", admin_views.AdminAuditLogView.as_view(), name="adm_audit_log"),
    path("admin/task-queue/", admin_views.AdminTaskQueueView.as_view(), name="adm_task_queue"),
    path("admin/toxic-shield/", admin_views.AdminToxicMessageShieldView.as_view(), name="adm_toxic_shield"),
    path("admin/toxic-shield/<str:pattern_id>/", admin_views.AdminToxicMessageShieldView.as_view(), name="adm_toxic_shield_detail"),
    path("admin/api-cost-limits/", admin_views.AdminAPICostLimitsView.as_view(), name="adm_api_costs"),
    path("admin/instructors/", admin_views.AdminInstructorLeaderboardView.as_view(), name="adm_instructors_leaderboard"),
    path("admin/blueprint-schedule/", admin_views.AdminBlueprintScheduleView.as_view(), name="adm_blueprint_schedule"),
    
    path("notifications/register/", NotificationRegisterView.as_view(), name="notifications_register"),
    path("notifications/inbox/", NotificationInboxView.as_view(), name="notifications_inbox"),
]
