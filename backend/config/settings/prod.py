from .base import *

import os

DEBUG = False

# Accept custom domain AND the auto-generated hosting platform domains
_allowed = os.environ.get("ALLOWED_HOST", "")
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(",") if h.strip()]
# Always allow Railway and Render auto-generated domains, plus local interfaces for health checks
ALLOWED_HOSTS += [".up.railway.app", ".onrender.com", "localhost", "127.0.0.1", "0.0.0.0"]
# Railway internal network: healthcheck probes arrive with the container's internal IP as the
# Host header (e.g. 10.x.x.x), which Django rejects with 400 unless we allow it.
# Adding "*" is safe here because Railway's edge proxy handles external-facing security.
if os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("RAILWAY_PROJECT_ID"):
    ALLOWED_HOSTS += ["*"]

if not os.environ.get("DJANGO_SECRET_KEY"):
    raise ValueError("DJANGO_SECRET_KEY environment variable must be set in production")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")

# Security headers (allow external proxy load-balancers to enforce SSL)
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "False").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CORS - restrict to known origins in production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "").split(",")
    if o.strip()
]

# Rate limiting for auth endpoints
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["login"] = "5/min"
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["register"] = "3/min"
