from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def public_health_check(request):
    """Lightweight healthcheck — always returns 200 immediately.
    Does NOT ping MongoDB so Railway never sees a timeout here."""
    import time
    return JsonResponse({
        "status": "ok",
        "message": "Wamdh API is healthy",
        "timestamp": time.time(),
    })


def db_health_check(request):
    """Deep healthcheck that verifies MongoDB connectivity.
    Use this for monitoring dashboards, not Railway's liveness probe."""
    import time
    db_status = "unknown"
    try:
        from config.mongodb import client as mongo_client
        mongo_client.admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"unreachable: {str(e)[:80]}"
    return JsonResponse({
        "status": "ok" if db_status == "connected" else "degraded",
        "message": "Wamdh API is healthy",
        "db": db_status,
        "timestamp": time.time(),
    })


urlpatterns = [
    path("health/", public_health_check),
    path("health/db/", db_health_check),
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
