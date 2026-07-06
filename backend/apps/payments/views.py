import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings

# PLANS
PLANS = {
    "monthly": {"price": 9.99, "label": "Monthly Premium", "duration_days": 30},
    "yearly":  {"price": 59.99, "label": "Yearly Premium",  "duration_days": 365},
    "lifetime":{"price": 149.99,"label": "Lifetime Access", "duration_days": 36500},
}

FEATURES_FREE = [
    "10 AI summaries / month",
    "5 note uploads",
    "Basic quiz generation",
    "Community chat",
    "Study planner",
]

FEATURES_PREMIUM = [
    "Unlimited AI summaries",
    "Unlimited note uploads",
    "Advanced quiz + flashcard AI",
    "Priority AI responses",
    "Study groups",
    "Vocabulary builder",
    "Weekly performance reports",
    "Offline access",
    "Remove all limits",
]


class PlansView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        is_premium = getattr(user, "is_premium", False)
        premium_until = getattr(user, "premium_until", None)

        return Response({
            "is_premium": is_premium,
            "premium_until": premium_until.isoformat() if premium_until else None,
            "plans": PLANS,
            "features_free": FEATURES_FREE,
            "features_premium": FEATURES_PREMIUM,
        })


class CreatePaymentIntentView(APIView):
    """Create a Stripe PaymentIntent (or simulate it if Stripe not configured)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_key = request.data.get("plan", "monthly")
        plan = PLANS.get(plan_key)
        if not plan:
            return Response({"error": "Invalid plan"}, status=400)

        stripe_key = getattr(settings, "STRIPE_SECRET_KEY", "")

        if stripe_key:
            try:
                import stripe
                stripe.api_key = stripe_key
                intent = stripe.PaymentIntent.create(
                    amount=int(plan["price"] * 100),
                    currency="usd",
                    metadata={
                        "user_id": request.user.id,
                        "plan": plan_key,
                    },
                )
                return Response({
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "amount": plan["price"],
                    "plan": plan,
                })
            except Exception as e:
                return Response({"error": str(e)}, status=500)
        else:
            # Demo mode — return mock client secret
            return Response({
                "client_secret": f"demo_{plan_key}_{request.user.id}",
                "payment_intent_id": f"demo_pi_{request.user.id}",
                "amount": plan["price"],
                "plan": plan,
                "demo": True,
            })


class ConfirmPaymentView(APIView):
    """After successful payment, upgrade user to premium."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_key = request.data.get("plan", "monthly")
        payment_intent_id = request.data.get("payment_intent_id", "")
        plan = PLANS.get(plan_key)
        if not plan:
            return Response({"error": "Invalid plan"}, status=400)

        # In production: verify Stripe payment before upgrading
        stripe_key = getattr(settings, "STRIPE_SECRET_KEY", "")
        if stripe_key and not payment_intent_id.startswith("demo_"):
            try:
                import stripe
                stripe.api_key = stripe_key
                pi = stripe.PaymentIntent.retrieve(payment_intent_id)
                if pi["status"] != "succeeded":
                    return Response({"error": "Payment not completed"}, status=402)
            except Exception as e:
                return Response({"error": str(e)}, status=500)

        # Upgrade user
        user = request.user
        user.is_premium = True
        user.premium_until = datetime.datetime.utcnow() + datetime.timedelta(days=plan["duration_days"])
        user.xp_points += 500  # Bonus XP for subscribing
        user.save()

        return Response({
            "success": True,
            "message": f"Welcome to Premium! You now have {plan['label']} access.",
            "premium_until": user.premium_until.isoformat(),
            "xp_earned": 500,
        })


class PremiumStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        is_premium = getattr(user, "is_premium", False)
        premium_until = getattr(user, "premium_until", None)

        # Auto-expire premium
        if is_premium and premium_until and premium_until < datetime.datetime.utcnow():
            user.is_premium = False
            user.save()
            is_premium = False

        return Response({
            "is_premium": is_premium,
            "premium_until": premium_until.isoformat() if premium_until else None,
        })

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """Webhook listener to capture Stripe checkout events and handle user upgrades."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.headers.get("Stripe-Signature", "")
        endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")

        event = None

        if endpoint_secret:
            try:
                import stripe
                stripe.api_key = settings.STRIPE_SECRET_KEY
                event = stripe.Webhook.construct_event(
                    payload, sig_header, endpoint_secret
                )
            except Exception as e:
                return Response({"error": str(e)}, status=400)
        else:
            import json
            try:
                event = json.loads(payload.decode("utf-8"))
            except Exception:
                return Response({"error": "Invalid payload"}, status=400)

        event_type = event.get("type") if isinstance(event, dict) else getattr(event, "type", "")
        data_obj = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object

        from django.contrib.auth import get_user_model
        from config.mongodb import db
        User = get_user_model()
        orders_col = db["orders"]
        notifications_col = db["notifications"]
        memberships_col = db["memberships"]

        if event_type in ["checkout.session.completed", "invoice.paid", "payment_intent.succeeded"]:
            metadata = data_obj.get("metadata", {})
            user_id = metadata.get("user_id")
            purchase_type = metadata.get("purchase_type")
            
            if user_id:
                user = User.objects.filter(id=user_id).first()
                if user:
                    if purchase_type == "store_item":
                        item_id = metadata.get("item_id")
                        from apps.payments.store import find_catalog_item
                        item = find_catalog_item(item_id)
                        
                        now = datetime.datetime.utcnow()
                        expires_at = None
                        if item and item.get("type") == "cash_monthly":
                            expires_at = now + datetime.timedelta(days=30)
                            
                        db["user_purchases"].update_one(
                            {"user_id": int(user_id), "item_id": item_id},
                            {
                                "$set": {
                                    "purchased_at": now,
                                    "expires_at": expires_at,
                                    "quantity": 0
                                }
                            },
                            upsert=True
                        )
                        
                        orders_col.insert_one({
                            "user_id": int(user_id),
                            "item_id": item_id,
                            "price": float(data_obj.get("amount_received", data_obj.get("amount_total", 0)) / 100),
                            "status": "PAID",
                            "stripe_payment_id": data_obj.get("id"),
                            "created_at": now
                        })
                        
                        notifications_col.insert_one({
                            "user_id": int(user_id),
                            "type": "store_purchase",
                            "title": "Item Unlocked! 🛒",
                            "message": f"Your purchase of '{item['name'] if item else item_id}' was verified. Go check it out!",
                            "read": False,
                            "created_at": now
                        })
                    else:
                        plan_key = metadata.get("plan", "monthly")
                        user.is_premium = True
                        duration_days = 30 if plan_key == "monthly" else (365 if plan_key == "yearly" else 36500)
                        user.premium_until = datetime.datetime.utcnow() + datetime.timedelta(days=duration_days)
                        user.xp_points += 500
                        user.save()

                        from config.mongodb import users_col
                        users_col.update_one(
                            {"username": user.username},
                            {"$set": {"is_premium": True, "premium_until": user.premium_until, "xp_points": user.xp_points}}
                        )

                        orders_col.insert_one({
                            "user_id": int(user_id),
                            "plan": plan_key,
                            "price": float(data_obj.get("amount_total", 999) / 100),
                            "status": "PAID",
                            "stripe_session_id": data_obj.get("id"),
                            "created_at": datetime.datetime.utcnow()
                        })

                        memberships_col.update_one(
                            {"user_id": int(user_id)},
                            {"$set": {
                                "plan_id": plan_key,
                                "status": "active",
                                "expires_at": user.premium_until
                            }},
                            upsert=True
                        )

                        notifications_col.insert_one({
                            "user_id": int(user_id),
                            "type": "premium_upgrade",
                            "title": "Welcome to Wamdh VIP! 👑",
                            "message": "Thank you for upgrading! You now have unlimited access to all platform features.",
                            "read": False,
                            "created_at": datetime.datetime.utcnow()
                        })

        elif event_type == "charge.refunded":
            metadata = data_obj.get("metadata", {})
            user_id = metadata.get("user_id")
            
            user = User.objects.filter(id=user_id).first() if user_id else None
            if user:
                user.is_premium = False
                user.save()

                from config.mongodb import users_col
                users_col.update_one(
                    {"username": user.username},
                    {"$set": {"is_premium": False}}
                )

                orders_col.update_many(
                    {"user_id": int(user_id), "stripe_session_id": data_obj.get("id")},
                    {"$set": {"status": "REFUNDED"}}
                )

                memberships_col.update_one(
                    {"user_id": int(user_id)},
                    {"$set": {"status": "refunded"}}
                )

                notifications_col.insert_one({
                    "user_id": int(user_id),
                    "type": "membership_alert",
                    "title": "Membership Refunded",
                    "message": "Your subscription refund has been processed. Access limits are now active.",
                    "read": False,
                    "created_at": datetime.datetime.utcnow()
                })

        elif event_type == "customer.subscription.deleted" or event_type == "customer.subscription.cancelled":
            user_id = data_obj.get("metadata", {}).get("user_id")
            
            user = User.objects.filter(id=user_id).first() if user_id else None
            if user:
                user.is_premium = False
                user.premium_until = datetime.datetime.utcnow()
                user.save()

                from config.mongodb import users_col
                users_col.update_one(
                    {"username": user.username},
                    {"$set": {"is_premium": False, "premium_until": None}}
                )

                memberships_col.update_one(
                    {"user_id": int(user_id)},
                    {"$set": {"status": "cancelled", "cancelled_at": datetime.datetime.utcnow()}}
                )

                notifications_col.insert_one({
                    "user_id": int(user_id),
                    "type": "membership_alert",
                    "title": "Subscription Cancelled",
                    "message": "Your premium subscription has been cancelled. You now have free tier access.",
                    "read": False,
                    "created_at": datetime.datetime.utcnow()
                })

        elif event_type == "invoice.payment_failed":
            user_id = data_obj.get("metadata", {}).get("user_id")
            attempt_count = data_obj.get("attempt_count", 0)
            
            user = User.objects.filter(id=user_id).first() if user_id else None
            if user and attempt_count >= 3:
                user.is_premium = False
                user.save()

                from config.mongodb import users_col
                users_col.update_one(
                    {"username": user.username},
                    {"$set": {"is_premium": False}}
                )

                notifications_col.insert_one({
                    "user_id": int(user_id),
                    "type": "membership_alert",
                    "title": "Payment Failed",
                    "message": "Your subscription payment failed after multiple attempts. Premium access has been suspended.",
                    "read": False,
                    "created_at": datetime.datetime.utcnow()
                })

        return Response({"received": True}, status=200)
