"""
Wamdh Locust Load Test File
Usage: locust -f locustfile.py --host=http://localhost:8000 --users 50 --spawn-rate 5 --run-time 2m --headless --html locust_report.html
Install: pip install locust
"""
from locust import HttpUser, task, between
import json

# Pre-login credentials for the load test user
# Create this user once via POST /api/auth/register/ before running
TEST_USERNAME = "qa_load_test_user"
TEST_PASSWORD = "LoadTestPass123!"


class StudentUser(HttpUser):
    """Simulates a typical student browsing the app."""
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        """Authenticate before starting tasks."""
        resp = self.client.post(
            "/api/auth/login/",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
            name="[AUTH] Login",
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access", "")
        else:
            self.token = ""

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    # Dashboard (most frequent action — 3x weight)
    @task(3)
    def get_analytics_summary(self):
        self.client.get("/api/analytics/summary/",
                        headers=self._headers(),
                        name="[ANALYTICS] Summary")

    # Heatmap — called on every dashboard open
    @task(2)
    def get_heatmap(self):
        self.client.get("/api/analytics/heatmap/",
                        headers=self._headers(),
                        name="[ANALYTICS] Heatmap")

    # Notes list
    @task(2)
    def get_notes(self):
        self.client.get("/api/notes/",
                        headers=self._headers(),
                        name="[NOTES] List")

    # Chat history (opens on AI tutor tab)
    @task(2)
    def get_chat_history(self):
        self.client.get("/api/rag/chat/history/",
                        headers=self._headers(),
                        name="[RAG] Chat History")

    # Leaderboard
    @task(1)
    def get_leaderboard(self):
        self.client.get("/api/analytics/leaderboard/",
                        headers=self._headers(),
                        name="[ANALYTICS] Leaderboard")

    # Flashcard decks
    @task(1)
    def get_flashcards(self):
        self.client.get("/api/flashcards/",
                        headers=self._headers(),
                        name="[FLASHCARDS] Decks")

    # Messages rooms
    @task(1)
    def get_rooms(self):
        self.client.get("/api/messages/rooms/",
                        headers=self._headers(),
                        name="[MESSAGES] Rooms")

    # Planner
    @task(1)
    def get_planner(self):
        self.client.get("/api/planner/",
                        headers=self._headers(),
                        name="[PLANNER] Get Plan")

    # Weekly analytics
    @task(1)
    def get_weekly(self):
        self.client.get("/api/analytics/weekly/",
                        headers=self._headers(),
                        name="[ANALYTICS] Weekly")

    # Payments status check
    @task(1)
    def get_premium_status(self):
        self.client.get("/api/payments/status/",
                        headers=self._headers(),
                        name="[PAYMENTS] Status")


class AIHeavyUser(HttpUser):
    """Simulates a power user generating AI content (lower concurrency)."""
    wait_time = between(5, 10)
    token = None

    def on_start(self):
        resp = self.client.post(
            "/api/auth/login/",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
            name="[AUTH] Login (AI user)",
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access", "")

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"}

    @task(1)
    def ai_quiz_generate(self):
        self.client.post(
            "/api/ai/quiz/",
            json={"topic": "Photosynthesis", "num_questions": 3},
            headers=self._headers(),
            name="[AI] Quiz Generate",
        )

    @task(1)
    def ai_study_tip(self):
        self.client.post(
            "/api/ai/study-tip/",
            json={"subject": "Mathematics"},
            headers=self._headers(),
            name="[AI] Study Tip",
        )

    @task(1)
    def rag_chat(self):
        self.client.post(
            "/api/rag/chat/",
            json={"message": "Explain the key concepts from my notes"},
            headers=self._headers(),
            name="[RAG] Chat",
        )
