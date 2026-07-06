import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from config.mongodb import db, clean_doc, clean_docs

# STORE CATALOG DEFINITION
STORE_ITEMS = {
    # Non-consumable Cash items
    "themes": [
        {"id": "theme_cyber_neon", "name": "Cyber Neon Theme", "desc": "Accent cyber-pink & purple, custom dark mode variation", "price": 1.99, "type": "cash"},
        {"id": "theme_sora_light", "name": "Sora Sunset Theme", "desc": "Accent warm sunset orange, minimal light mode variant", "price": 0.99, "type": "cash"},
        {"id": "theme_dark_material", "name": "Pitch Black Theme", "desc": "Sleek gold accents, pure OLED dark variation", "price": 2.99, "type": "cash"},
    ],
    "templates": [
        {"id": "template_med_anatomy", "name": "Medical Anatomy Layout", "desc": "Subject-focused pre-built visual templates for doctors/biology", "price": 1.99, "type": "cash"},
        {"id": "template_software_arch", "name": "Software Architecture Specs", "desc": "Structured note templates for diagrams and API schemas", "price": 2.99, "type": "cash"},
        {"id": "template_math_formulas", "name": "Math & Formula Sheet Cheat", "desc": "Pre-formatted notes layouts optimized for equations & graphs", "price": 3.99, "type": "cash"},
    ],
    "personalities": [
        {"id": "personality_einstein", "name": "Albert Einstein Pack", "desc": "Your AI Tutor responds like a physics genius, detailing theories step-by-step", "price": 3.99, "type": "cash"},
        {"id": "personality_socrates", "name": "Socratic Tutor Pack", "desc": "AI will prompt you with questions instead of giving direct answers to boost critical thinking", "price": 2.99, "type": "cash"},
        {"id": "personality_pirate", "name": "Pirate Explainer Pack", "desc": "AI Chat answers in sea-shanty pirate slang for a fun, casual study break", "price": 4.99, "type": "cash"},
    ],
    # Consumable XP items
    "consumables": [
        {"id": "consumable_streak_freeze", "name": "Streak Freeze", "desc": "Preserves your daily streak if you miss a study checklist day", "price_xp": 500, "type": "xp"},
        {"id": "consumable_hint_token", "name": "Hint Token", "desc": "Allows requesting a helpful Gemini tip during any quiz attempt", "price_xp": 100, "type": "xp"},
        {"id": "consumable_extra_queries", "name": "Extra AI Queries", "desc": "+20 extra daily AI questions to chat with tutor", "price_xp": 300, "type": "xp"},
        {"id": "consumable_focus_boost", "name": "Focus Boost Session", "desc": "Unlocks extended Pomodoro mode with focus soundscapes", "price_xp": 250, "type": "xp"},
        {"id": "consumable_xp_multiplier", "name": "2x XP Multiplier", "desc": "Doubles all XP awards earned across the app for 24 hours", "price_xp": 1000, "type": "xp"},
    ],
    # Subscription Add-ons
    "addons": [
        {"id": "addon_offline_pack", "name": "Offline Pack Add-on", "desc": "Download summaries and quiz questions local to your phone", "price": 2.99, "type": "cash_monthly"},
        {"id": "addon_analytics", "name": "Advanced Analytics Add-on", "desc": "Unlock deep learning insights and weekly PDF statistics", "price": 1.99, "type": "cash_monthly"},
        {"id": "addon_cloud_backup", "name": "Cloud Backup Add-on", "desc": "Automatic workspace backups and notes syncing", "price": 1.49, "type": "cash_monthly"},
    ]
}


def find_catalog_item(item_id):
    for cat in STORE_ITEMS.values():
        for item in cat:
            if item["id"] == item_id:
                return item
    return None


class StoreCatalogView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = request.user.id
        purchases = list(db["user_purchases"].find({"user_id": user_id}))
        
        owned_ids = []
        consumables_inventory = {}
        active_subscriptions = []

        now = datetime.datetime.utcnow()

        for p in purchases:
            item_id = p.get("item_id")
            expires_at = p.get("expires_at")
            
            # Check expiry for subscriptions or time-based multipliers
            if expires_at and expires_at < now:
                continue

            if p.get("quantity", 0) > 0:
                consumables_inventory[item_id] = p.get("quantity")
            else:
                owned_ids.append(item_id)
                if expires_at:
                    active_subscriptions.append(item_id)

        return Response({
            "catalog": STORE_ITEMS,
            "owned_non_consumables": owned_ids,
            "owned_consumables": consumables_inventory,
            "active_subscriptions": active_subscriptions,
            "user_xp": request.user.xp_points
        })


class PurchaseXpItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        item_id = request.data.get("item_id")
        item = find_catalog_item(item_id)
        
        if not item or item.get("type") != "xp":
            return Response({"error": "Item not purchasable with XP"}, status=400)
            
        cost_xp = item.get("price_xp", 999999)
        user = request.user
        
        if user.xp_points < cost_xp:
            return Response({"error": "Insufficient XP balance"}, status=400)
            
        # Deduct XP
        user.xp_points -= cost_xp
        user.save()
        
        # Update replica
        from config.mongodb import users_col
        users_col.update_one(
            {"username": user.username},
            {"$set": {"xp_points": user.xp_points}}
        )

        now = datetime.datetime.utcnow()
        expires_at = None
        
        # If it's a multiplier, set expiry for 24h
        if item_id == "consumable_xp_multiplier":
            expires_at = now + datetime.timedelta(hours=24)

        if item_id in ["consumable_streak_freeze", "consumable_hint_token"]:
            # Increment quantity
            db["user_purchases"].update_one(
                {"user_id": user.id, "item_id": item_id},
                {
                    "$inc": {"quantity": 1},
                    "$set": {"updated_at": now}
                },
                upsert=True
            )
        else:
            # Upsert standard non-consumable or multiplier
            db["user_purchases"].update_one(
                {"user_id": user.id, "item_id": item_id},
                {
                    "$set": {
                        "purchased_at": now,
                        "expires_at": expires_at,
                        "quantity": 0
                    }
                },
                upsert=True
            )

        return Response({
            "success": True,
            "message": f"Successfully purchased {item['name']}!",
            "user_xp": user.xp_points
        })


class CreateStorePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        item_id = request.data.get("item_id")
        item = find_catalog_item(item_id)
        
        if not item or item.get("type") not in ["cash", "cash_monthly"]:
            return Response({"error": "Invalid item or cash type required"}, status=400)

        price = item.get("price", 0.0)
        stripe_key = getattr(settings, "STRIPE_SECRET_KEY", "")

        if stripe_key:
            try:
                import stripe
                stripe.api_key = stripe_key
                intent = stripe.PaymentIntent.create(
                    amount=int(price * 100),
                    currency="usd",
                    metadata={
                        "user_id": request.user.id,
                        "item_id": item_id,
                        "purchase_type": "store_item"
                    },
                )
                return Response({
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "amount": price,
                    "item": item,
                })
            except Exception as e:
                return Response({"error": str(e)}, status=500)
        else:
            # Demo Mode
            return Response({
                "client_secret": f"demo_store_{item_id}_{request.user.id}",
                "payment_intent_id": f"demo_pi_store_{item_id}_{request.user.id}",
                "amount": price,
                "item": item,
                "demo": True,
            })


class ConfirmStorePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        item_id = request.data.get("item_id")
        payment_intent_id = request.data.get("payment_intent_id", "")
        item = find_catalog_item(item_id)
        
        if not item:
            return Response({"error": "Invalid item"}, status=400)

        # Stripe validation
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

        # Log purchase
        now = datetime.datetime.utcnow()
        expires_at = None
        if item.get("type") == "cash_monthly":
            expires_at = now + datetime.timedelta(days=30)

        db["user_purchases"].update_one(
            {"user_id": request.user.id, "item_id": item_id},
            {
                "$set": {
                    "purchased_at": now,
                    "expires_at": expires_at,
                    "quantity": 0
                }
            },
            upsert=True
        )

        return Response({
            "success": True,
            "message": f"Successfully purchased {item['name']}!",
            "expires_at": expires_at.isoformat() if expires_at else None
        })
