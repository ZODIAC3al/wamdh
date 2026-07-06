from django.urls import path
from .views import (
    OverviewStatsView, WeeklyStudyTimeView, SubjectTimeView,
    WeakTopicsView, LogSessionView, HeatmapView, AchievementsView,
    LeaderboardView, GpaView, EventTrackingView, PredictiveAnalyticsView,
    ExamPredictorView, SmartRecommendationView, StickerListView,
    UserStickerListView, StickerPurchaseView, CommunityLeaderboardView,
    CommunityBadgesView, CommunityChallengesView, CommunityMissionsView,
    XpShopView
)

urlpatterns = [
    path("summary/", OverviewStatsView.as_view(), name="analytics_summary"),
    path("weekly/", WeeklyStudyTimeView.as_view(), name="analytics_weekly"),
    path("subjects/", SubjectTimeView.as_view(), name="analytics_subjects"),
    path("weak-topics/", WeakTopicsView.as_view(), name="analytics_weak_topics"),
    path("session/", LogSessionView.as_view(), name="analytics_log_session"),
    path("heatmap/", HeatmapView.as_view(), name="analytics_heatmap"),
    path("achievements/", AchievementsView.as_view(), name="analytics_achievements"),
    path("leaderboard/", LeaderboardView.as_view(), name="analytics_leaderboard"),
    path("gpa/", GpaView.as_view(), name="analytics_gpa"),
    path("event/", EventTrackingView.as_view(), name="analytics_event_track"),
    path("predict/", PredictiveAnalyticsView.as_view(), name="analytics_predict"),
    path("exam/", ExamPredictorView.as_view(), name="analytics_exam_predict"),
    path("recommendations/", SmartRecommendationView.as_view(), name="analytics_recommendations"),
    path("stickers/", StickerListView.as_view(), name="stickers_list"),
    path("stickers/my/", UserStickerListView.as_view(), name="user_stickers"),
    path("stickers/<str:sticker_id>/purchase/", StickerPurchaseView.as_view(), name="sticker_purchase"),
    path("communities/<str:community_id>/leaderboard/", CommunityLeaderboardView.as_view(), name="community_leaderboard"),
    path("communities/<str:community_id>/badges/", CommunityBadgesView.as_view(), name="community_badges"),
    path("communities/<str:community_id>/challenges/", CommunityChallengesView.as_view(), name="community_challenges"),
    path("community-missions/", CommunityMissionsView.as_view(), name="community_missions"),
    path("xp-shop/", XpShopView.as_view(), name="analytics_xp_shop"),
]

