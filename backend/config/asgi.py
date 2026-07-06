import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")
django.setup()

from django.urls import path
from channels.auth import AuthMiddlewareStack

def websocket_placeholder_for_future_consumers():
    """Placeholder for WebSocket consumers.
    
    Future implementation should add:
    - Real-time chat messaging (apps.messages)
    - Live quiz updates (apps.quiz)  
    - Study session collaboration (apps.flashcards)
    """
    pass

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(URLRouter([])),
})