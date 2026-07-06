import datetime
import json
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from config.mongodb import db, clean_doc, clean_docs, stickers_col, user_stickers_col, achievements_col, user_achievements_col, get_object_id
from apps.notes.models import Note
from apps.quiz.models import QuizAttempt
from apps.ai_engine.gemini import call_gemini


class OverviewStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        sessions = list(db["study_sessions"].find({"user_id": user_id}).sort("created_at", -1).limit(30))
        total_minutes = sum(s.get("duration_minutes", 0) for s in sessions)
        return Response({
            "total_study_time": total_minutes,
            "streak_days": getattr(request.user, "streak_days", 0),
            "xp_points": getattr(request.user, "xp_points", 0),
        })


class WeeklyStudyTimeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        sessions = list(db["study_sessions"].find({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        }))
        return Response(clean_docs(sessions))


class SubjectTimeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$subject", "total_minutes": {"$sum": "$duration_minutes"}}},
            {"$sort": {"total_minutes": -1}}
        ]
        result = list(db["study_sessions"].aggregate(pipeline))
        return Response(clean_docs(result))


class WeakTopicsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        weak = list(db["weak_topics"].find({"user_id": user_id}))
        return Response(clean_docs(weak))


class LogSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_id = request.user.id
        data = {
            "user_id": user_id,
            "subject": request.data.get("subject"),
            "duration_minutes": request.data.get("duration_minutes", 0),
            "activity_type": request.data.get("activity_type", "general"),
            "created_at": datetime.datetime.utcnow()
        }
        db["study_sessions"].insert_one(data)
        return Response({"message": "Session logged"}, status=status.HTTP_201_CREATED)


class HeatmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        sessions = list(db["study_sessions"].find({"user_id": user_id}))
        dates = {}
        for s in sessions:
            date_str = s.get("created_at", datetime.datetime.utcnow()).strftime("%Y-%m-%d")
            dates[date_str] = dates.get(date_str, 0) + s.get("duration_minutes", 0)
        return Response(dates)


class AchievementsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = str(request.user.id)
        
        # Fetch user unlocked achievements ids
        unlocked_docs = list(db["user_achievements"].find({"user_id": user_id}))
        unlocked_ids = {doc["achievement_id"] for doc in unlocked_docs}
        
        # Fetch all global achievements
        all_achievements = list(achievements_col.find({}))
        
        # Fetch user stats
        stats = db["user_stats"].find_one({"user_id": user_id})
        if not stats:
            stats = {}
            
        # Map achievement IDs to metrics and targets
        progress_map = {
            "first_note": ("notes_created", 1),
            "note_taker_pro": ("notes_created", 50),
            "note_master": ("notes_created", 100),
            "ai_summary_ace": ("summaries_generated", 10),
            "ai_summary_legend": ("summaries_generated", 50),
            "bookmark_hunter": ("bookmarks_saved", 20),
            "bookmark_expert": ("bookmarks_saved", 50),
            "vocab_builder": ("vocab_terms_added", 50),
            "vocab_master": ("vocab_terms_added", 150),
            "first_quiz": ("quizzes_completed", 1),
            "perfect_score": ("perfect_quizzes", 1),
            "quiz_master": ("quizzes_completed", 50),
            "quiz_streak": ("days_studied_streak", 7),
            "speed_demon": ("quizzes_under_2min", 1),
            "first_deck": ("decks_created", 1),
            "card_collector": ("mastered_flashcards", 100),
            "retention_king": ("perfect_flashcards", 1),
            "daily_grinder": ("days_studied_streak", 30),
            "first_chat": ("ai_queries", 1),
            "ai_guru": ("ai_queries", 100),
            "eli5_explorer": ("eli5_uses", 10),
            "voice_pilot": ("voice_sessions", 20),
            "tutor_friend": ("tutor_sessions", 10),
            "first_plan": ("plans_created", 1),
            "goal_crusher": ("planner_tasks_completed", 20),
            "planner_champion": ("planner_tasks_completed", 100),
            "early_bird": ("studied_at_5am", 1),
            "weekend_warrior": ("weekend_study_sessions", 5),
            "first_join": ("joined_communities", 1),
            "community_voice": ("community_messages", 50),
            "resource_sharer": ("community_resources_shared", 10),
            "helper_badge": ("community_messages", 20),
            "group_leader": ("communities_created", 5),
            "first_run": ("code_runs", 1),
            "polyglot_coder": ("languages_count", 5),
            "challenge_solver": ("challenges_solved", 5),
            "bug_hunter": ("bug_fixes", 5),
            "referral_hero": ("referrals_sent", 5),
            "night_owl": ("studied_after_midnight", 1),
            "explorer": ("visited_features_count", 8),
            "social_butterfly": ("friends_count", 10),
            "code_ninja": ("code_runs", 100),
            "whiteboard_artist": ("whiteboard_drawings", 10),
            "grade_high": ("grades_a", 5),
        }

        unlocked_list = []
        locked_list = []
        
        # User total XP from database
        user_xp = getattr(request.user, "xp_points", 0)
        level = user_xp // 500 + 1
        
        for ach in all_achievements:
            ach_id = ach.get("id")
            
            # Compute progress
            current = 0
            target = 1
            if ach_id in progress_map:
                metric, target = progress_map[ach_id]
                if metric == "languages_count":
                    current = len(stats.get("languages_used", []))
                elif metric == "xp_collector":
                    current = user_xp
                    target = 10000
                elif metric == "master_student":
                    current = level
                    target = 10
                elif metric == "upgraded":
                    current = 1 if stats.get("is_premium") or getattr(request.user, "is_premium", False) else 0
                    target = 1
                else:
                    current = stats.get(metric, 0)
            
            ach_data = clean_doc(ach)
            ach_data["current_progress"] = current
            ach_data["target_progress"] = target
            
            if ach_id in unlocked_ids:
                ach_data["unlocked"] = True
                unlocked_list.append(ach_data)
            else:
                ach_data["unlocked"] = False
                locked_list.append(ach_data)

        level_titles = ["Rookie", "Scholar", "Expert", "Master", "Grandmaster", "Legend"]
        title_idx = min((level - 1) // 2, len(level_titles) - 1)
        
        return Response({
            "unlocked": unlocked_list,
            "locked": locked_list,
            "level": level,
            "level_title": level_titles[title_idx],
            "total_xp": user_xp,
            "next_level_xp": (level) * 500,
            "progress_percent": ((user_xp % 500) / 5) if user_xp > 0 else 0
        })


class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from config.mongodb import users_col
        top_users = list(users_col.find({"role": "student"}).sort("xp_points", -1).limit(20))
        standings = []
        for index, u in enumerate(top_users):
            standings.append({
                "rank": index + 1,
                "username": u.get("username", "Student"),
                "xp_points": u.get("xp_points", 0),
                "streak_days": u.get("streak_days", 0),
                "profile_photo_url": u.get("profile_photo_url", "")
            })
        return Response(standings)


class GpaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        grades = list(db["grades"].find({"user_id": user_id}))
        return Response(clean_docs(grades))

    def post(self, request, *args, **kwargs):
        user_id = request.user.id
        db["grades"].insert_one({
            "user_id": user_id,
            "subject": request.data.get("subject"),
            "grade": request.data.get("grade"),
            "credits": request.data.get("credits", 0),
            "created_at": datetime.datetime.utcnow()
        })
        return Response({"message": "Grade saved"}, status=status.HTTP_201_CREATED)


class EventTrackingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_id = request.user.id
        event = {
            "user_id": user_id,
            "event_type": request.data.get("type"),
            "metadata": request.data.get("metadata", {}),
            "created_at": datetime.datetime.utcnow()
        }
        db["events"].insert_one(event)
        return Response({"message": "Event tracked"}, status=status.HTTP_201_CREATED)


class PredictiveAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from config.mongodb import quiz_attempts_col
        # Find subject with lowest quiz scores
        pipeline = [
            {"$match": {"user_id": request.user.id}},
            {"$group": {"_id": "$subject", "avg_score": {"$avg": "$score"}}},
            {"$sort": {"avg_score": 1}},
            {"$limit": 1}
        ]
        results = list(quiz_attempts_col.aggregate(pipeline))
        if results and results[0]["_id"]:
            focus_subject = results[0]["_id"]
            prediction = f"Based on your recent scores, you should focus on {focus_subject} to improve your grade."
        else:
            # Fallback to least studied subject
            sessions_pipeline = [
                {"$match": {"user_id": request.user.id}},
                {"$group": {"_id": "$subject", "total_minutes": {"$sum": "$duration_minutes"}}},
                {"$sort": {"total_minutes": 1}},
                {"$limit": 1}
            ]
            session_results = list(db["study_sessions"].aggregate(sessions_pipeline))
            if session_results and session_results[0]["_id"]:
                prediction = f"You have spent the least amount of study time on {session_results[0]['_id']} this week. Try reviewing it."
            else:
                prediction = "Welcome to Wamdh! Upload your first study note to kick off AI learning predictions."
                
        return Response({"prediction": prediction})


class ExamPredictorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from config.mongodb import quiz_attempts_col
        attempts = list(quiz_attempts_col.find({"user_id": request.user.id}).sort("completed_at", -1).limit(5))
        predicted_topics = []
        for a in attempts:
            for iq in a.get("incorrect_questions", []):
                topic = iq.get("topic") or iq.get("question")
                if topic and len(predicted_topics) < 3:
                    short_topic = " ".join(topic.split()[:3])
                    if short_topic not in predicted_topics:
                        predicted_topics.append(short_topic)
                        
        if not predicted_topics:
            subjects = db["notes"].distinct("subject", {"user_id": request.user.id})
            predicted_topics = subjects[:3] if subjects else ["Active Recall", "General Study"]
            
        return Response({"predicted_topics": predicted_topics})


class SmartRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from config.mongodb import quiz_attempts_col
        recommendations = []
        
        # Check active streak
        stats = db["user_stats"].find_one({"user_id": str(request.user.id)})
        if stats:
            streak = stats.get("days_studied_streak", 0)
            if streak < 3:
                recommendations.append("Complete your daily planner task to start a study streak!")
                
        # Check low quiz scores
        last_quiz = quiz_attempts_col.find_one({"user_id": request.user.id}, sort=[("completed_at", -1)])
        if last_quiz and last_quiz.get("score", 100) < 80:
            recommendations.append(f"Revise flashcards on incorrect answers in {last_quiz.get('subject', 'notes')}.")
            
        # Check upload count
        notes_count = db["notes"].count_documents({"user_id": request.user.id})
        if notes_count == 0:
            recommendations.append("Upload a PDF study note to generate interactive AI summaries.")
        else:
            recommendations.append("Review your flashcards deck for spaced repetition memory recall.")
            
        if len(recommendations) < 2:
            recommendations.append("Take a practice quiz on your recent notes to test your understanding.")
            recommendations.append("Schedule a focus session block in the planner to organize your day.")
            
        return Response({"recommendations": recommendations[:3]})


class StickerListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        is_premium = getattr(user, "is_premium", False)

        query = {"is_free": True}
        if is_premium:
            query = {}

        stickers = list(stickers_col.find(query).sort("category", 1))

        return Response({
            "stickers": clean_docs(stickers),
            "total_count": len(stickers),
            "free_count": sum(1 for s in stickers if s["is_free"]),
            "paid_count": sum(1 for s in stickers if not s["is_free"]),
        })


class UserStickerListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_id = user.id

        owned = list(user_stickers_col.find({"user_id": user_id}))
        return Response(clean_docs(owned))


class StickerPurchaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, sticker_id, *args, **kwargs):
        user = request.user

        sticker = stickers_col.find_one({"_id": get_object_id(sticker_id)})
        if not sticker:
            return Response({"error": "Sticker not found"}, status=status.HTTP_404_NOT_FOUND)

        if sticker["is_free"]:
            return Response({"error": "Sticker is free, no purchase needed"}, status=status.HTTP_400_BAD_REQUEST)

        if user.xp_points < sticker.get("xp_cost", 100):
            return Response({"error": "Insufficient XP points"}, status=status.HTTP_400_BAD_REQUEST)

        user.xp_points -= sticker["xp_cost"]
        user.save()

        user_stickers_col.insert_one({
            "user_id": user.id,
            "sticker_id": sticker_id,
            "purchased_at": datetime.datetime.utcnow()
        })

        return Response({
            "success": True,
            "message": f"Purchased {sticker.get('name', 'sticker')}!",
            "xp_remaining": user.xp_points
        })


class CommunityLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, community_id):
        pipeline = [
            {"$match": {"community_id": community_id}},
            {"$group": {"_id": "$user_id", "xp": {"$sum": "$xp_earned"}, "messages": {"$sum": 1}}},
            {"$sort": {"xp": -1}},
            {"$limit": 20}
        ]
        leaderboard = list(db["community_contributions"].aggregate(pipeline))
        return Response(clean_docs(leaderboard))


class CommunityBadgesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, community_id):
        user_str_id = getattr(request.user, "mongo_id", str(request.user.id))
        user_contrib = db["community_contributions"].find_one({"community_id": community_id, "user_id": user_str_id})
        
        badges = []
        if user_contrib:
            if user_contrib.get("messages", 0) >= 100:
                badges.append({"id": "chatter", "name": "Chatter", "icon": "chatbubble"})
            if user_contrib.get("xp", 0) >= 500:
                badges.append({"id": "contributor", "name": "Contributor", "icon": "star"})
            if user_contrib.get("xp", 0) >= 1000:
                badges.append({"id": "leader", "name": "Community Leader", "icon": "trophy"})
        
        return Response({"badges": badges})


class CommunityChallengesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, community_id):
        challenges = [
            {"id": "weekly1", "title": "Post 10 messages this week", "xp": 50, "completed": False},
            {"id": "weekly2", "title": "Share 3 resources", "xp": 100, "completed": True},
            {"id": "weekly3", "title": "Help 5 members", "xp": 75, "completed": False},
        ]
        return Response(challenges)


class CommunityMissionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        missions = [
            {"id": "join_community", "title": "Join a Community", "desc": "Become part of a study group", "xp": 100, "completed": True, "progress": 1, "target": 1},
            {"id": "post_messages", "title": "Post 50 Messages", "desc": "Share your knowledge with peers", "xp": 300, "completed": False, "progress": 12, "target": 50},
            {"id": "share_resources", "title": "Share 10 Resources", "desc": "Upload notes or helpful links", "xp": 250, "completed": False, "progress": 3, "target": 10},
            {"id": "help_members", "title": "Help 20 Members", "desc": "Answer community questions", "xp": 400, "completed": False, "progress": 5, "target": 20},
            {"id": "create_community", "title": "Create Community", "desc": "Start your own study group", "xp": 350, "completed": False, "progress": 0, "target": 1},
            {"id": "weekly_active", "title": "Weekly Active", "desc": "Participate this week", "xp": 150, "completed": False, "progress": 2, "target": 5},
        ]
        return Response(missions)


class ExamPredictorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_notes = Note.objects.filter(user=request.user)
        notes_by_subject = {}
        for note in user_notes:
            notes_by_subject[note.subject] = notes_by_subject.get(note.subject, 0) + 1

        attempts = QuizAttempt.objects.filter(user=request.user).select_related("quiz")
        quiz_metrics = []
        for att in attempts:
            quiz_metrics.append({
                "quiz_title": att.quiz.title,
                "score": att.score,
                "difficulty": att.quiz.difficulty,
            })

        prompt = f"""
You are an expert academic counselor and Exam Predictor. Analyze the student's current learning profile:
- Notes created by subject: {json.dumps(notes_by_subject)}
- Past quiz scores and attempt difficulty: {json.dumps(quiz_metrics)}

Predict the likely focus topics, estimated weight percentages (totaling 100%), and priority recommendations for the student's study plan.
Return ONLY a valid JSON string (no markdown formatting, no code blocks) matching this schema:
{{
  "predictions": [
    {{
      "subject": "Chemistry",
      "predicted_weight": 35,
      "priority": "High",
      "reason": "Note density is high but average quiz scores indicate conceptual gaps."
    }}
  ],
  "recommendations": [
    "Focus on Organic Chemistry nomenclature flashcards first.",
    "Review weak areas in Physics mechanics quiz."
  ]
}}
"""
        response_text = call_gemini(prompt).strip()
        
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()

        try:
            data = json.loads(response_text)
        except Exception:
            data = {
                "predictions": [
                    {
                        "subject": "General Study",
                        "predicted_weight": 100,
                        "priority": "Medium",
                        "reason": "Verify your note counts and complete more quiz attempts for finer predictions."
                    }
                ],
                "recommendations": [
                    "Complete more self-quizzes to enable detailed AI predictions.",
                    "Log more study notes to update your study weights."
                ]
            }

        return Response(data)


class XpShopView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        purchases = list(db["user_purchases"].find({"user_id": request.user.id}))
        purchased_ids = {p["item_id"] for p in purchases}

        shop_items = [
            {
                "id": "personality_socrates",
                "name": "Socrates AI Tutor",
                "arabic_name": "سقراط - معلم ذكي",
                "price": 300,
                "category": "personality",
                "desc": "Unlocks the Socrates personality context, prompting you with guided questions.",
                "arabic_desc": "يفك القفل عن شخصية سقراط، حيث يطرح عليك أسئلة إرشادية بدلاً من إعطائك الإجابة مباشرة."
            },
            {
                "id": "personality_einstein",
                "name": "Einstein AI Tutor",
                "arabic_name": "أينشتاين - معلم ذكي",
                "price": 500,
                "category": "personality",
                "desc": "Unlocks Einstein physics analogies and scientific insights in AI tutoring.",
                "arabic_desc": "يفك القفل عن شخصية أينشتاين ليجيبك بأمثلة فيزيائية ورؤى علمية قيمة."
            },
            {
                "id": "personality_pirate",
                "name": "Pirate AI Tutor",
                "arabic_name": "القرصان - معلم ذكي",
                "price": 200,
                "category": "personality",
                "desc": "Unlocks Pirate speech accents while keeping teaching insights accurate.",
                "arabic_desc": "يفك القفل عن شخصية القرصان الممتعة لتجيبك بأسلوب القراصنة اللطيف."
            },
            {
                "id": "theme_dark_neon",
                "name": "Neon Dark Theme",
                "arabic_name": "المظهر المظلم النيوني",
                "price": 400,
                "category": "theme",
                "desc": "Unlock a premium glowing neon aesthetic theme configuration.",
                "arabic_desc": "يفك القفل عن مظهر نيوني مظلم مميز وجميل جداً."
            },
            {
                "id": "streak_freeze",
                "name": "Streak Freeze Token",
                "arabic_name": "تمويه الحفاظ على السلسلة",
                "price": 350,
                "category": "token",
                "desc": "Protects your active study streak from lapsing for one idle day.",
                "arabic_desc": "يحمي سلسلة دراستك من الانقطاع ليوم واحد في حال انشغالك."
            }
        ]

        for item in shop_items:
            item["unlocked"] = item["id"] in purchased_ids

        return Response({
            "xp_balance": request.user.xp_points,
            "items": shop_items
        })

    def post(self, request, *args, **kwargs):
        item_id = request.data.get("item_id")
        if not item_id:
            return Response({"error": "item_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        prices = {
            "personality_socrates": 300,
            "personality_einstein": 500,
            "personality_pirate": 200,
            "theme_dark_neon": 400,
            "streak_freeze": 350
        }

        if item_id not in prices:
            return Response({"error": "Invalid item_id"}, status=status.HTTP_404_NOT_FOUND)

        price = prices[item_id]

        already_owned = db["user_purchases"].find_one({
            "user_id": request.user.id,
            "item_id": item_id
        })
        if already_owned and item_id != "streak_freeze":
            return Response({"error": "You already own this item"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.xp_points < price:
            return Response({"error": "Insufficient XP points balance"}, status=status.HTTP_400_BAD_REQUEST)

        user.xp_points -= price
        user.save()

        db["user_purchases"].insert_one({
            "user_id": user.id,
            "item_id": item_id,
            "price_paid": price,
            "purchased_at": datetime.datetime.utcnow()
        })

        return Response({
            "message": "Purchase successful!",
            "xp_balance": user.xp_points
        })