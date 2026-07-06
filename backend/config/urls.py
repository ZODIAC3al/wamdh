from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def public_health_check(request):
    return JsonResponse({"status": "ok", "message": "Wamdh API is healthy"})

urlpatterns = [
    path("health/", public_health_check),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/notes/", include("apps.notes.urls")),
    path("api/ai/", include("apps.ai_engine.urls")),
    path("api/rag/", include("apps.rag.urls")),
    path("api/quiz/", include("apps.quiz.urls")),
    path("api/flashcards/", include("apps.flashcards.urls")),
    path("api/planner/", include("apps.planner.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/messages/", include("apps.messages.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/sandbox/", include("apps.sandbox.urls")),
    path("api/", include("apps.users.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
