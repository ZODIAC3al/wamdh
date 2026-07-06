from django.urls import path
from .views import (
    SummarizeView, QuizGenerateView, FlashcardGenerateView,
    KeyPointsView, StudyTipView, VoiceTutorView, LectureGeneratorView,
    CodeTutorView, EssayGraderView, WordExplorerView, PronunciationScoreView,
    AiGradingView
)

urlpatterns = [
    path("summarize/", SummarizeView.as_view(), name="ai_summarize"),
    path("quiz/", QuizGenerateView.as_view(), name="ai_quiz"),
    path("flashcards/", FlashcardGenerateView.as_view(), name="ai_flashcards"),
    path("key-points/", KeyPointsView.as_view(), name="ai_key_points"),
    path("study-tip/", StudyTipView.as_view(), name="ai_study_tip"),
    path("voice/", VoiceTutorView.as_view(), name="ai_voice_tutor"),
    path("lecture/", LectureGeneratorView.as_view(), name="ai_lecture_generator"),
    path("code/", CodeTutorView.as_view(), name="ai_code_tutor"),
    path("essay/", EssayGraderView.as_view(), name="ai_essay_grader"),
    path("word-explorer/", WordExplorerView.as_view(), name="ai_word_explorer"),
    path("pronounce-score/", PronunciationScoreView.as_view(), name="ai_pronunciation_score"),
    path("grade/", AiGradingView.as_view(), name="ai_grading"),
]

