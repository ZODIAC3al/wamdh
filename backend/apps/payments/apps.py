import logging
from django.apps import AppConfig
from django.conf import settings

logger = logging.getLogger(__name__)

class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.payments'

    def ready(self):
        stripe_key = getattr(settings, "STRIPE_SECRET_KEY", "")
        if not stripe_key:
            logger.warning("[Wamdh Payments] Warning: STRIPE_SECRET_KEY is not set. Payments will fall back to SIMULATION/DEMO mode.")
        else:
            if stripe_key.startswith("sk_test_"):
                logger.info("[Wamdh Payments] Stripe integrated successfully in TEST mode.")
            elif stripe_key.startswith("sk_live_"):
                logger.info("[Wamdh Payments] Stripe integrated successfully in LIVE mode.")
            else:
                logger.warning("[Wamdh Payments] Stripe integrated with non-standard secret key prefix.")
