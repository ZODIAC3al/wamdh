from django.urls import path
from .views import (
    PlansView, CreatePaymentIntentView, ConfirmPaymentView,
    PremiumStatusView, StripeWebhookView
)
from .store import (
    StoreCatalogView, PurchaseXpItemView, CreateStorePaymentIntentView,
    ConfirmStorePaymentView
)

urlpatterns = [
    path("plans/", PlansView.as_view(), name="payment_plans"),
    path("create-intent/", CreatePaymentIntentView.as_view(), name="create_payment_intent"),
    path("confirm/", ConfirmPaymentView.as_view(), name="confirm_payment"),
    path("status/", PremiumStatusView.as_view(), name="premium_status"),
    path("webhook/", StripeWebhookView.as_view(), name="payment_webhook"),
    path("store/catalog/", StoreCatalogView.as_view(), name="store_catalog"),
    path("store/buy-xp/", PurchaseXpItemView.as_view(), name="store_buy_xp"),
    path("store/create-intent/", CreateStorePaymentIntentView.as_view(), name="store_create_intent"),
    path("store/confirm/", ConfirmStorePaymentView.as_view(), name="store_confirm"),
]
