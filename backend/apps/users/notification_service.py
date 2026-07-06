import requests
from django.conf import settings
from .models import NotificationToken, NotificationInbox

def send_push_notification(user, title, body, data=None):
    # Log the message to the user's inbox
    NotificationInbox.objects.create(
        user=user,
        title=title,
        body=body
    )

    # Fetch push tokens
    token_records = NotificationToken.objects.filter(user=user)
    tokens = [rec.token for rec in token_records]

    if not tokens:
        print(f"[Push Notif Fallback Alert] To User {user.username}: {title} - {body}")
        return False

    payload = []
    for token in tokens:
        if token.startswith("ExponentPushToken"):
            payload.append({
                "to": token,
                "title": title,
                "body": body,
                "data": data or {}
            })

    if not payload:
        return False

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=payload,
            headers={
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        print(f"[Push Notif Success] Sent payload status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"[Push Notif Request Error]: {e}")
        return False
