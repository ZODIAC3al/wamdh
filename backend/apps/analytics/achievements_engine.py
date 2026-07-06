import datetime
from config.mongodb import db, clean_doc
from django.contrib.auth import get_user_model

# Collections
stats_col = db["user_stats"]
user_achievements_col = db["user_achievements"]
achievements_col = db["achievements"]


def track_user_action(user_id, action_type, increment=1, value=None):
    """
    Tracks a user metric, updates user_stats, and evaluates if any achievements should unlock.
    user_id: ID of the user (normally the SQL integer user.id or mongo_id string)
    action_type: name of the stat (e.g. "notes_created", "quizzes_completed")
    increment: amount to increment (usually 1)
    value: optional custom value (e.g. language name for "languages_used")
    """
    user_id = str(user_id)
    
    # Get or create stats document
    stats = stats_col.find_one({"user_id": user_id})
    if not stats:
        stats = {
            "user_id": user_id,
            "notes_created": 0,
            "summaries_generated": 0,
            "bookmarks_saved": 0,
            "vocab_terms_added": 0,
            "quizzes_completed": 0,
            "perfect_quizzes": 0,
            "quizzes_under_2min": 0,
            "flashcard_reviews": 0,
            "mastered_flashcards": 0,
            "ai_queries": 0,
            "eli5_uses": 0,
            "voice_sessions": 0,
            "planner_tasks_completed": 0,
            "joined_communities": 0,
            "community_messages": 0,
            "community_resources_shared": 0,
            "code_runs": 0,
            "languages_used": [],
            "challenges_solved": 0,
            "referrals_sent": 0,
            "logins_count": 0,
            "days_studied_streak": 0,
            "studied_at_5am": 0,
            "studied_after_midnight": 0,
            "is_premium": False,
            "xp_earned_total": 0,
            "friends_count": 0,
            "whiteboard_drawings": 0,
            "grades_a": 0,
            "decks_created": 0,
            "perfect_flashcards": 0,
            "tutor_sessions": 0,
            "plans_created": 0,
            "weekend_study_sessions": 0,
            "communities_created": 0,
            "bug_fixes": 0,
            "premium_days": 0,
            "visited_features_count": 0,
        }
        stats_col.insert_one(stats)

    # Update stats
    update_query = {}
    if action_type == "languages_used" and value:
        if value not in stats.get("languages_used", []):
            update_query["$addToSet"] = {"languages_used": value}
    elif action_type in stats:
        update_query["$inc"] = {action_type: increment}
        # Locally update stats dictionary for direct evaluation below
        stats[action_type] = stats.get(action_type, 0) + increment

    if update_query:
        stats_col.update_one({"user_id": user_id}, update_query)
        # Fetch updated version to ensure lists/complex fields are synced
        stats = stats_col.find_one({"user_id": user_id})

    # Find which achievements the user already unlocked
    unlocked_ids = set(
        doc["achievement_id"] for doc in user_achievements_col.find({"user_id": user_id})
    )

    # Get User Model for total XP / Level checks
    User = get_user_model()
    try:
        user = User.objects.get(id=int(user_id) if user_id.isdigit() else user_id)
        user_xp = user.xp_points
        user_level = user_xp // 500 + 1
    except (User.DoesNotExist, ValueError):
        user_xp = 0
        user_level = 1
        user = None

    # Criteria definition
    # Formatted as: achievement_id -> condition_lambda
    criteria = {
        "first_login": lambda s: s.get("logins_count", 0) >= 1,
        "profile_complete": lambda s: s.get("profile_complete", False) is True,
        "onboarding_complete": lambda s: s.get("onboarding_complete", False) is True,
        "first_note": lambda s: s.get("notes_created", 0) >= 1,
        "note_taker_pro": lambda s: s.get("notes_created", 0) >= 50,
        "note_master": lambda s: s.get("notes_created", 0) >= 100,
        "ai_summary_ace": lambda s: s.get("summaries_generated", 0) >= 10,
        "ai_summary_legend": lambda s: s.get("summaries_generated", 0) >= 50,
        "bookmark_hunter": lambda s: s.get("bookmarks_saved", 0) >= 20,
        "bookmark_expert": lambda s: s.get("bookmarks_saved", 0) >= 50,
        "vocab_builder": lambda s: s.get("vocab_terms_added", 0) >= 50,
        "vocab_master": lambda s: s.get("vocab_terms_added", 0) >= 150,
        "first_quiz": lambda s: s.get("quizzes_completed", 0) >= 1,
        "perfect_score": lambda s: s.get("perfect_quizzes", 0) >= 1,
        "quiz_master": lambda s: s.get("quizzes_completed", 0) >= 50,
        "quiz_streak": lambda s: s.get("days_studied_streak", 0) >= 7,
        "speed_demon": lambda s: s.get("quizzes_under_2min", 0) >= 1,
        "first_deck": lambda s: s.get("decks_created", 0) >= 1,
        "card_collector": lambda s: s.get("mastered_flashcards", 0) >= 100,
        "retention_king": lambda s: s.get("perfect_flashcards", 0) >= 1,
        "daily_grinder": lambda s: s.get("days_studied_streak", 0) >= 30,
        "first_chat": lambda s: s.get("ai_queries", 0) >= 1,
        "ai_guru": lambda s: s.get("ai_queries", 0) >= 100,
        "eli5_explorer": lambda s: s.get("eli5_uses", 0) >= 10,
        "voice_pilot": lambda s: s.get("voice_sessions", 0) >= 20,
        "tutor_friend": lambda s: s.get("tutor_sessions", 0) >= 10,
        "first_plan": lambda s: s.get("plans_created", 0) >= 1,
        "goal_crusher": lambda s: s.get("planner_tasks_completed", 0) >= 20,
        "planner_champion": lambda s: s.get("planner_tasks_completed", 0) >= 100,
        "early_bird": lambda s: s.get("studied_at_5am", 0) >= 1,
        "weekend_warrior": lambda s: s.get("weekend_study_sessions", 0) >= 5,
        "first_join": lambda s: s.get("joined_communities", 0) >= 1,
        "community_voice": lambda s: s.get("community_messages", 0) >= 50,
        "resource_sharer": lambda s: s.get("community_resources_shared", 0) >= 10,
        "helper_badge": lambda s: s.get("community_messages", 0) >= 20,
        "group_leader": lambda s: s.get("communities_created", 0) >= 5,
        "first_run": lambda s: s.get("code_runs", 0) >= 1,
        "polyglot_coder": lambda s: len(s.get("languages_used", [])) >= 5,
        "challenge_solver": lambda s: s.get("challenges_solved", 0) >= 5,
        "bug_hunter": lambda s: s.get("bug_fixes", 0) >= 5,
        "upgraded": lambda s: s.get("is_premium", False) is True,
        "loyal_learner": lambda s: s.get("premium_days", 0) >= 30,
        "xp_collector": lambda s: user_xp >= 10000,
        "early_adopter": lambda s: True,  # Unlock immediately
        "referral_hero": lambda s: s.get("referrals_sent", 0) >= 5,
        "night_owl": lambda s: s.get("studied_after_midnight", 0) >= 1,
        "explorer": lambda s: s.get("visited_features_count", 0) >= 8,
        "master_student": lambda s: user_level >= 10,
        "social_butterfly": lambda s: s.get("friends_count", 0) >= 10,
        "code_ninja": lambda s: s.get("code_runs", 0) >= 100,
        "whiteboard_artist": lambda s: s.get("whiteboard_drawings", 0) >= 10,
        "grade_high": lambda s: s.get("grades_a", 0) >= 5
    }

    # Evaluate locks
    newly_unlocked = []
    for ach_id, condition in criteria.items():
        if ach_id not in unlocked_ids:
            try:
                if condition(stats):
                    ach_template = achievements_col.find_one({"id": ach_id})
                    ach_xp = ach_template.get("xp", 100) if ach_template else 100

                    # Check if 2x XP multiplier is active
                    now = datetime.datetime.utcnow()
                    uid_val = user.id if user else (int(user_id) if user_id.isdigit() else user_id)
                    multiplier = db["user_purchases"].find_one({
                        "user_id": uid_val,
                        "item_id": "consumable_xp_multiplier",
                        "expires_at": {"$gt": now}
                    })
                    if multiplier:
                        ach_xp *= 2

                    # Record unlock
                    user_achievements_col.insert_one({
                        "user_id": user_id,
                        "achievement_id": ach_id,
                        "unlocked_at": now,
                        "double_xp_applied": bool(multiplier)
                    })
                    newly_unlocked.append(ach_id)

                    # Award XP
                    if user:
                        user.xp_points += ach_xp
                        user.save()
                        
                        # Sync back to mongo users replica
                        from config.mongodb import users_col
                        users_col.update_one(
                            {"username": user.username},
                            {"$set": {"xp_points": user.xp_points}}
                        )
            except Exception as e:
                print(f"Error evaluating achievement {ach_id}: {e}")

    return newly_unlocked
