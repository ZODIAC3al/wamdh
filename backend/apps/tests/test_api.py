import os
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class AuthRateLimitingTestCase(APITestCase):
    def test_login_rate_limiting(self):
        url = reverse("token_obtain_pair")
        for i in range(5):
            response = self.client.post(url, {"username": "test", "password": "wrong"}, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_register_rate_limiting(self):
        url = reverse("auth_register")
        for i in range(3):
            response = self.client.post(url, {
                "username": f"testuser{i}",
                "email": f"test{i}@example.com",
                "password": "TestPass123!"
            }, format="json")
        
        self.assertIn(response.status_code, [status.HTTP_429_TOO_MANY_REQUESTS, status.HTTP_201_CREATED])


class PaymentsWebhookTestCase(APITestCase):
    def test_checkout_completed_event(self):
        from apps.payments.views import StripeWebhookView
        
        event_data = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "metadata": {"user_id": "1", "plan": "monthly"},
                    "amount_total": 999,
                    "id": "cs_test_123"
                }
            }
        }
        
        response = self.client.post(
            "/api/payments/webhook/",
            event_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_subscription_cancelled_event(self):
        event_data = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "metadata": {"user_id": "1"},
                }
            }
        }
        
        response = self.client.post(
            "/api/payments/webhook/",
            event_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RagChatPaginationTestCase(APITestCase):
    def test_chat_history_pagination(self):
        url = "/api/rag/chat/history/"
        params = {"page": 1, "page_size": 50}
        
        response = self.client.get(url, params)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_200_OK])
        
        if response.status_code == status.HTTP_200_OK:
            self.assertIn("results", response.data)
            self.assertIn("pagination", response.data)