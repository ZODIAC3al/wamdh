from django.urls import path
from .views import (
    QuizListView, QuizDetailView, QuizAttemptSubmitView,
    QuizAttemptListView, QuizStatsView, QuizPracticeSubmitView,
    QuizHintView
)

urlpatterns = [
    path("", QuizListView.as_view(), name="quiz_list"),
    path("stats/", QuizStatsView.as_view(), name="quiz_stats"),
    path("practice/submit/", QuizPracticeSubmitView.as_view(), name="quiz_practice_submit"),
    path("hint/", QuizHintView.as_view(), name="quiz_hint"),
    path("<str:pk>/", QuizDetailView.as_view(), name="quiz_detail"),
    path("<str:quiz_id>/attempts/", QuizAttemptListView.as_view(), name="quiz_attempts"),
    path("<str:quiz_id>/attempt/", QuizAttemptSubmitView.as_view(), name="quiz_attempt_submit"),
]
