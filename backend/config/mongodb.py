import os
import pymongo
from pymongo.collection import Collection
from bson import ObjectId
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "wamdh")

# Initialize pymongo client with short timeouts so a missing/unreachable
# MongoDB instance fails fast (5 s) instead of hanging Gunicorn workers.
client = pymongo.MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=10000,
)
db = client[MONGO_DB_NAME]

# Collections reference helpers
notes_col = db["notes"]
embeddings_col = db["embeddings"]
quizzes_col = db["quizzes"]
quiz_attempts_col = db["quiz_attempts"]
decks_col = db["flashcard_decks"]
cards_col = db["flashcards"]
sessions_col = db["study_sessions"]
plans_col = db["study_plans"]
users_col = db["users"]
lessons_col = db["lessons"]
submissions_col = db["submissions"]
centers_col = db["centers"]
reviews_col = db["reviews"]
meetings_col = db["meetings"]
orders_col = db["orders"]
membership_plans_col = db["membership_plans"]
memberships_col = db["memberships"]
blog_posts_col = db["blog_posts"]
categories_col = db["categories"]
tags_col = db["tags"]
stickers_col = db["stickers"]
user_stickers_col = db["user_stickers"]
achievements_col = db["achievements"]
user_achievements_col = db["user_achievements"]

def get_object_id(id_str):
    """Safely convert a string hex into a BSON ObjectId."""
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str

def clean_doc(doc):
    """Serialize MongoDB documents to JSON-compatible dictionaries."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, (datetime, date)):
            doc[k] = v.isoformat()
    return doc

def clean_docs(docs):
    """Serialize a list of MongoDB documents."""
    return [clean_doc(d) for d in docs]


# --- AUTO-SEEDING INTERCEPTOR (HAVE 2 DUMMY DOCS FOR EACH IF EMPTY) ---
SEED_DATA = {
    "users": [
        {
            "sql_id": 1,
            "username": "demo_student",
            "email": "student@wamdh.com",
            "role": "student",
            "password": "password",
            "xp_points": 1200,
            "streak_days": 5,
            "profile_photo_url": "",
            "banner_image_url": "",
            "bio": "Passionate chemistry student.",
            "is_banned": False
        },
        {
            "sql_id": 2,
            "username": "demo_instructor",
            "email": "instructor@wamdh.com",
            "role": "instructor",
            "password": "password",
            "xp_points": 850,
            "streak_days": 3,
            "profile_photo_url": "",
            "banner_image_url": "",
            "bio": "High school science educator.",
            "is_banned": False
        }
    ],
    "notes": [
        {
            "user_id": 1,
            "username": "demo_student",
            "title": "Alkanes Nomenclature",
            "subject": "Chemistry",
            "raw_text": "Alkanes are saturated hydrocarbons with single covalent bonds. The general formula is CnH2n+2. Methane (CH4) is the simplest, followed by ethane, propane, and butane. Alkanes are relatively unreactive except for combustion and halogenation.",
            "chunks": [
                "Alkanes are saturated hydrocarbons with single covalent bonds. The general formula is CnH2n+2. Methane (CH4) is the simplest, followed by ethane, propane, and butane. Alkanes are relatively unreactive except for combustion and halogenation."
            ],
            "word_count": 35,
            "is_processed": True,
            "file_url": "",
            "file_type": "text"
        },
        {
            "user_id": 1,
            "username": "demo_student",
            "title": "Introduction to Limits",
            "subject": "Math",
            "raw_text": "A limit is the fundamental concept in calculus describing the behavior of a function near a specific point. As x approaches c, f(x) approaches L. Continuity is defined by the limit matching the function value.",
            "chunks": [
                "A limit is the fundamental concept in calculus describing the behavior of a function near a specific point. As x approaches c, f(x) approaches L. Continuity is defined by the limit matching the function value."
            ],
            "word_count": 36,
            "is_processed": True,
            "file_url": "",
            "file_type": "text"
        }
    ],
    "embeddings": [
        {
            "note_id": "dummy_chemistry",
            "user_id": 1,
            "chunk_index": 0,
            "chunk_text": "Alkanes are saturated hydrocarbons with single covalent bonds. The general formula is CnH2n+2. Methane (CH4) is the simplest, followed by ethane, propane, and butane. Alkanes are relatively unreactive except for combustion and halogenation.",
            "embedding_vector": [0.1] * 384
        },
        {
            "note_id": "dummy_math",
            "user_id": 1,
            "chunk_index": 0,
            "chunk_text": "A limit is the fundamental concept in calculus describing the behavior of a function near a specific point. As x approaches c, f(x) approaches L. Continuity is defined by the limit matching the function value.",
            "embedding_vector": [0.2] * 384
        }
    ],
    "quizzes": [
        {
            "user_id": 1,
            "title": "Alkanes Basics Test",
            "subject": "Chemistry",
            "difficulty": "easy",
            "questions": [
                {
                    "question": "What is the general molecular formula for Alkanes?",
                    "options": ["CnH2n", "CnH2n+2", "CnH2n-2", "CnHn"],
                    "answer": "CnH2n+2",
                    "explanation": "Alkanes are fully saturated hydrocarbons following CnH2n+2."
                }
            ]
        },
        {
            "user_id": 1,
            "title": "Limits & Continuity Test",
            "subject": "Math",
            "difficulty": "medium",
            "questions": [
                {
                    "question": "What defines a function as continuous at point c?",
                    "options": [
                        "The limit exists and equals the function value at c.",
                        "The function value is infinite.",
                        "The function has a vertical asymptote.",
                        "None of the above."
                    ],
                    "answer": "The limit exists and equals the function value at c.",
                    "explanation": "A function f is continuous at c if the limit as x approaches c is f(c)."
                }
            ]
        }
    ],
    "quiz_attempts": [
        {
            "user_id": 1,
            "username": "demo_student",
            "quiz": "dummy_quiz_1",
            "quiz_title": "Alkanes Basics Test",
            "score": 100.0,
            "correct_answers": 1,
            "total_questions": 1
        },
        {
            "user_id": 1,
            "username": "demo_student",
            "quiz": "dummy_quiz_2",
            "quiz_title": "Limits & Continuity Test",
            "score": 0.0,
            "correct_answers": 0,
            "total_questions": 1
        }
    ],
    "flashcard_decks": [
        {
            "user_id": 1,
            "title": "Organic Chem nomenclature",
            "subject": "Chemistry",
            "card_count": 1
        },
        {
            "user_id": 1,
            "title": "Basic Limits Definitions",
            "subject": "Math",
            "card_count": 1
        }
    ],
    "flashcards": [
        {
            "deck_id": "dummy_deck_1",
            "user_id": 1,
            "front": "What is the simplest Alkane?",
            "back": "Methane (CH4).",
            "repetitions": 1,
            "interval_days": 1,
            "ease_factor": 2.5,
            "next_review": datetime.utcnow()
        },
        {
            "deck_id": "dummy_deck_2",
            "user_id": 1,
            "front": "State the limit continuity condition.",
            "back": "Limit as x approaches c equals f(c).",
            "repetitions": 1,
            "interval_days": 1,
            "ease_factor": 2.5,
            "next_review": datetime.utcnow()
        }
    ],
    "study_sessions": [
        {
            "user_id": 1,
            "subject": "Chemistry",
            "duration_minutes": 45,
            "activity_type": "note",
            "date": datetime.utcnow()
        },
        {
            "user_id": 1,
            "subject": "Math",
            "duration_minutes": 30,
            "activity_type": "quiz",
            "date": datetime.utcnow()
        }
    ],
    "study_plans": [
        {
            "user_id": 1,
            "days": [
                {
                    "date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "tasks": [
                        {
                            "id": 1,
                            "subject": "Chemistry",
                            "topic": "Alkanes Nomenclature",
                            "duration_mins": 45,
                            "completed": False
                        }
                    ]
                }
            ]
        },
        {
            "user_id": 1,
            "days": [
                {
                    "date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "tasks": [
                        {
                            "id": 2,
                            "subject": "Math",
                            "topic": "Continuity Limits",
                            "duration_mins": 30,
                            "completed": False
                        }
                    ]
                }
            ]
        }
    ],
    "classrooms": [
        {
            "instructor_id": 2,
            "instructor_name": "demo_instructor",
            "name": "Chemistry Advanced Section",
            "subject": "Chemistry",
            "description": "Exploration of alkanes, alkenes, and valencies.",
            "student_ids": [1]
        },
        {
            "instructor_id": 2,
            "instructor_name": "demo_instructor",
            "name": "Calculus 101",
            "subject": "Math",
            "description": "Understanding limits, derivatives and continuity.",
            "student_ids": [1]
        }
    ],
    "assignments": [
        {
            "classroom_id": "dummy_classroom_1",
            "title": "Alkanes Struct Drawing Task",
            "note_id": "dummy_note_1",
            "quiz_id": "dummy_quiz_1",
            "due_date": "2026-07-25"
        },
        {
            "classroom_id": "dummy_classroom_2",
            "title": "Calculate limit worksheet",
            "note_id": "dummy_note_2",
            "quiz_id": "dummy_quiz_2",
            "due_date": "2026-07-30"
        }
    ],
    "messages": [
        {
            "room_id": "dummy_room_1",
            "sender_id": "1",
            "text": "Hello, how does structural isomerism work in butane?",
            "created_at": datetime.utcnow()
        },
        {
            "room_id": "dummy_room_1",
            "sender_id": "2",
            "text": "Butane has 2 isomers: n-butane and isobutane.",
            "created_at": datetime.utcnow()
        }
    ],
    "message_rooms": [
        {
            "participants": ["1", "2"]
        },
        {
            "participants": ["1", "3"]
        }
    ],
    "friends": [
        {
            "user_id": "1",
            "friend_id": "3",
            "status": "accepted"
        },
        {
            "user_id": "1",
            "friend_id": "4",
            "status": "pending"
        }
    ],
    "groups": [
        {
            "name": "Science Whizzes Group",
            "members": ["1", "2"]
        },
        {
            "name": "Math Homework Group",
            "members": ["1", "3"]
        }
    ],
    "kanban_tasks": [
        {
            "user_id": 1,
            "topic": "Summarize Alkanes Nomenclature Note",
            "subject": "Chemistry",
            "status": "todo",
            "duration_mins": 30
        },
        {
            "user_id": 1,
            "topic": "Complete Limits Practice Quiz",
            "subject": "Math",
            "status": "done",
            "duration_mins": 15
        }
    ],
    "ai_chat_history": [
        {
            "user_id": 1,
            "sender": "user",
            "text": "Tell me about carbon valency.",
            "note_id": "dummy_chemistry"
        },
        {
            "user_id": 1,
            "sender": "ai",
            "text": "Carbon has a valency of 4, allowing it to form 4 covalent bonds with other atoms.",
            "note_id": "dummy_chemistry"
        }
    ],
    "notifications": [
        {
            "user_id": 1,
            "type": "warning",
            "title": "Test Warning Title",
            "message": "Verify notification display.",
            "read": False
        },
        {
            "user_id": 2,
            "type": "warning",
            "title": "Welcome Warning Title",
            "message": "Welcome to Wamdh Learning Platform.",
            "read": False
        }
    ],
    "reports": [
        {
            "reporter_id": 1,
            "reporter_name": "demo_student",
            "reported_user": "John",
            "report_type": "content",
            "reason": "Plagiarized chemistry note.",
            "content_type": "note",
            "content_id": "dummy_note_1",
            "status": "pending",
            "admin_notes": ""
        },
        {
            "reporter_id": 1,
            "reporter_name": "demo_student",
            "reported_user": "David",
            "report_type": "user",
            "reason": "Aggressive behavior in chat room.",
            "content_type": "user",
            "content_id": "dummy_user_2",
            "status": "pending",
            "admin_notes": ""
        }
    ],
    "settings": [
        {
            "key": "platform_config",
            "primary_provider": "gemini-1.5-flash",
            "fallback_provider": "huggingface",
            "student_daily_limit": 50,
            "instructor_daily_limit": 200,
            "emergency_kill_switch": False,
            "max_pdf_size_mb": 20,
            "max_image_size_mb": 10,
            "jwt_expiry_hours": 1,
            "refresh_token_days": 30,
            "max_login_attempts": 5,
            "registration_open": True
        },
        {
            "key": "developer_config",
            "verbose_logs": True,
            "mock_fallback_active": True
        }
    ],
    "gpa_data": [
        {
            "user_id": 1,
            "cumulative_gpa": 3.85,
            "total_credits": 24,
            "semesters": [
                {
                    "name": "Semester 1",
                    "gpa": 3.9,
                    "courses": [
                        {"name": "Organic Chemistry 101", "credits": 4, "grade": "A"},
                        {"name": "Calculus I", "credits": 4, "grade": "A-"}
                    ]
                }
            ]
        },
        {
            "user_id": 2,
            "cumulative_gpa": 4.0,
            "total_credits": 0,
            "semesters": []
        }
    ],
    "courses": [
        {
            "instructor_id": 2,
            "instructor_name": "demo_instructor",
            "title": "Advanced Organic Chemistry",
            "description": "Carbon structures and reactions",
            "category": "Chemistry",
            "tags": ["Organic", "Chemistry"],
            "thumbnail_url": "",
            "status": "published",
            "enrolled_count": 1
        },
        {
            "instructor_id": 2,
            "instructor_name": "demo_instructor",
            "title": "Calculus and Vectors",
            "description": "Limits, matrices, and functions",
            "category": "Math",
            "tags": ["Calculus", "Math"],
            "thumbnail_url": "",
            "status": "published",
            "enrolled_count": 1
        }
    ],
    "chapters": [
        {
            "course_id": "dummy_course_1",
            "title": "Chapter 1: Alkane Structures",
            "description": "Single bonds and molecular diagrams",
            "order": 1,
            "is_locked": False
        },
        {
            "course_id": "dummy_course_2",
            "title": "Chapter 1: Limits & Continuity",
            "description": "Calculating limits at a point",
            "order": 1,
            "is_locked": False
        }
    ],
    "materials": [
        {
            "course_id": "dummy_course_1",
            "chapter_id": "dummy_chapter_1",
            "title": "Alkanes Nomenclature Guide",
            "content_type": "document",
            "file_url": "",
            "ai_summary": "Saturated carbon chains (alkanes) follow CnH2n+2."
        },
        {
            "course_id": "dummy_course_2",
            "chapter_id": "dummy_chapter_2",
            "title": "Limit Theorems Reference",
            "content_type": "document",
            "file_url": "",
            "ai_summary": "A limit is the target value a function approaches."
        }
    ],
    "enrollments": [
        {
            "student_id": 1,
            "student_name": "demo_student",
            "course_id": "dummy_course_1",
            "course_title": "Advanced Organic Chemistry",
            "progress_percent": 60,
            "quiz_avg": 85,
            "study_hours": 12.5,
            "status": "performing",
            "weak_topics": []
        },
        {
            "student_id": 1,
            "student_name": "demo_student",
            "course_id": "dummy_course_2",
            "course_title": "Calculus and Vectors",
            "progress_percent": 30,
            "quiz_avg": 55,
            "study_hours": 6.2,
            "status": "at_risk",
            "weak_topics": ["Limits"]
        }
    ],
    "announcements": [
        {
            "instructor_id": 2,
            "instructor_name": "demo_instructor",
            "title": "Welcome to Organic Chemistry!",
            "content": "Class starts Monday morning. Read Chapter 1.",
            "classroom_id": "dummy_classroom_1"
        },
        {
            "instructor_id": 2,
            "instructor_name": "demo_instructor",
            "title": "Calculus Limit Homework",
            "content": "Review worksheet 1 limit calculations.",
            "classroom_id": "dummy_classroom_2"
        }
    ],
    "audit_logs": [
        {
            "admin_id": 3,
            "admin_name": "admin_user",
            "action": "login",
            "target_type": "system",
            "details": {"ip": "127.0.0.1"}
        },
        {
            "admin_id": 3,
            "admin_name": "admin_user",
            "action": "seed_db",
            "target_type": "database",
            "details": {"status": "success"}
        }
    ],
    "ai_quotas": [
        {
            "user_id": 1,
            "daily_count": 5,
            "daily_limit": 50,
            "last_reset": datetime.utcnow()
        },
        {
            "user_id": 2,
            "daily_count": 10,
            "daily_limit": 200,
            "last_reset": datetime.utcnow()
        }
    ],
    "lessons": [
        {
            "course_id": "dummy_course_1",
            "chapter_id": "dummy_chapter_1",
            "title": "Alkane Isomerism",
            "markdown_content": "Isomers are compounds with the same molecular formula but different structural arrangements. For example, butane and isobutane share the C4H10 formula.",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "duration_minutes": 15,
            "order_weight": 1,
            "free_preview": True
        }
    ],
    "submissions": [
        {
            "assignment_id": "dummy_assignment_1",
            "student_id": 1,
            "student_name": "demo_student",
            "code": "def alkane_formula(n):\n    return f'C{n}H{2*n+2}'",
            "status": "PENDING",
            "score": 0.0,
            "feedback": ""
        }
    ],
    "centers": [
        {
            "name": "Wamdh Main Center",
            "location": "Riyadh, KSA",
            "classrooms": [
                {"name": "Classroom Alpha", "capacity": 30},
                {"name": "Classroom Beta", "capacity": 25}
            ]
        }
    ],
    "reviews": [
        {
            "course_id": "dummy_course_1",
            "student_id": 1,
            "student_name": "demo_student",
            "rating": 5,
            "comment": "Outstanding explanations of hydrocarbon naming conventions!"
        }
    ],
    "meetings": [
        {
            "course_id": "dummy_course_1",
            "title": "Isomerism Q&A Session",
            "start_time": datetime.utcnow() + timedelta(days=1),
            "end_time": datetime.utcnow() + timedelta(days=1, hours=1),
            "video_url": "https://zoom.us/j/1234567890"
        }
    ],
    "orders": [
        {
            "user_id": 1,
            "plan": "monthly",
            "price": 9.99,
            "status": "PAID",
            "stripe_session_id": "cs_test_123456",
            "created_at": datetime.utcnow()
        }
    ],
    "membership_plans": [
        {
            "plan_id": "monthly",
            "name": "Monthly Premium",
            "price": 9.99,
            "features": ["Unlimited AI Summaries", "Priority Support", "Offline notes access"]
        }
    ],
    "memberships": [
        {
            "user_id": 1,
            "plan_id": "monthly",
            "status": "active",
            "expires_at": datetime.utcnow() + timedelta(days=30)
        }
    ],
    "blog_posts": [
        {
            "title": "Effective Spaced Repetition Tips",
            "content": "Spaced repetition uses SM-2 algorithm to adjust study intervals based on recall ease factor.",
            "tags": ["study", "productivity"],
            "read_count": 45,
            "published_at": datetime.utcnow()
        }
    ],
    "categories": [
        {
            "name": "Chemistry",
            "icon": "flask-outline"
        },
        {
            "name": "Math",
            "icon": "calculator-outline"
        }
    ],
    "tags": [
        {"name": "Organic"},
        {"name": "Calculus"}
    ],
    "achievements": [
        {"id": "first_login", "title": "Welcome Aboard", "desc": "Created your first Wamdh account", "icon": "sparkles", "color": "#10B981", "xp": 50},
        {"id": "profile_complete", "title": "Profile Complete", "desc": "Filled all profile fields", "icon": "person-circle", "color": "#3B82F6", "xp": 100},
        {"id": "onboarding_complete", "title": "Tutorial Master", "desc": "Completed app onboarding", "icon": "school", "color": "#8B5CF6", "xp": 150},
        {"id": "first_note", "title": "First Note", "desc": "Created your first study note", "icon": "document-text", "color": "#F59E0B", "xp": 100},
        {"id": "note_taker_pro", "title": "Note Taker Pro", "desc": "Created 50 notes", "icon": "documents", "color": "#EC4899", "xp": 250},
        {"id": "ai_summary_ace", "title": "AI Summary Ace", "desc": "Generated 10 AI summaries", "icon": "flash", "color": "#06B6D4", "xp": 200},
        {"id": "bookmark_hunter", "title": "Bookmark Hunter", "desc": "Saved 20 bookmarks", "icon": "bookmark", "color": "#BE1A1A", "xp": 150},
        {"id": "vocab_builder", "title": "Vocabulary Builder", "desc": "Added 100 vocabulary terms", "icon": "library", "color": "#10B981", "xp": 300},
        {"id": "first_quiz", "title": "First Quiz", "desc": "Completed your first quiz", "icon": "help-circle", "color": "#3B82F6", "xp": 100},
        {"id": "perfect_score", "title": "Perfect Score", "desc": "Scored 100% on a quiz", "icon": "trophy", "color": "#F59E0B", "xp": 250},
        {"id": "quiz_master", "title": "Quiz Master", "desc": "Completed 50 quizzes", "icon": "ribbon", "color": "#8B5CF6", "xp": 500},
        {"id": "quiz_streak", "title": "Streak Quiz", "desc": "Maintained 7-day quiz streak", "icon": "flame", "color": "#EF4444", "xp": 300},
        {"id": "speed_demon", "title": "Speed Demon", "desc": "Finished quiz in under 2 minutes", "icon": "speedometer", "color": "#06B6D4", "xp": 150},
        {"id": "first_deck", "title": "First Deck", "desc": "Created flashcard deck", "icon": "albums", "color": "#3B82F6", "xp": 100},
        {"id": "card_collector", "title": "Card Collector", "desc": "Mastered 100 flashcards", "icon": "albums", "color": "#10B981", "xp": 250},
        {"id": "retention_king", "title": "Retention King", "desc": "Achieved 90% recall rate", "icon": "brain", "color": "#8B5CF6", "xp": 350},
        {"id": "daily_grinder", "title": "Daily Grinder", "desc": "30-day flashcard streak", "icon": "calendar", "color": "#F59E0B", "xp": 400},
        {"id": "first_chat", "title": "First Chat", "desc": "Started AI conversation", "icon": "chatbubble", "color": "#3B82F6", "xp": 100},
        {"id": "ai_guru", "title": "AI Guru", "desc": "Made 100 AI queries", "icon": "sparkles", "color": "#06B6D4", "xp": 300},
        {"id": "eli5_explorer", "title": "ELI5 Explorer", "desc": "Used ELI5 mode 10 times", "icon": "happy", "color": "#10B981", "xp": 150},
        {"id": "voice_pilot", "title": "Voice Pilot", "desc": "Completed 20 voice sessions", "icon": "mic", "color": "#BE1A1A", "xp": 200},
        {"id": "tutor_friend", "title": "Tutor Friend", "desc": "AI helped improve your grade", "icon": "school", "color": "#8B5CF6", "xp": 500},
        {"id": "first_plan", "title": "First Plan", "desc": "Created study plan", "icon": "calendar", "color": "#3B82F6", "xp": 100},
        {"id": "goal_crusher", "title": "Goal Crusher", "desc": "Completed 20 planner tasks", "icon": "flag", "color": "#10B981", "xp": 250},
        {"id": "early_bird", "title": "Early Bird", "desc": "Studied at 5 AM", "icon": "sunny", "color": "#F59E0B", "xp": 150},
        {"id": "weekend_warrior", "title": "Weekend Warrior", "desc": "Studied on weekend", "icon": "triangle", "color": "#06B6D4", "xp": 200},
        {"id": "first_join", "title": "First Join", "desc": "Joined a community", "icon": "people", "color": "#8B5CF6", "xp": 100},
        {"id": "community_voice", "title": "Community Voice", "desc": "Posted 50 community messages", "icon": "chatbubbles", "color": "#3B82F6", "xp": 300},
        {"id": "resource_sharer", "title": "Resource Sharer", "desc": "Shared 10 community resources", "icon": "share", "color": "#10B981", "xp": 250},
        {"id": "helper_badge", "title": "Helper Badge", "desc": "Answered 20 community questions", "icon": "heart", "color": "#F59E0B", "xp": 400},
        {"id": "group_leader", "title": "Group Leader", "desc": "Created 5 communities", "icon": "group", "color": "#EF4444", "xp": 350},
        {"id": "first_run", "title": "First Run", "desc": "Executed code in playground", "icon": "code-slash", "color": "#3B82F6", "xp": 100},
        {"id": "polyglot_coder", "title": "Polyglot Coder", "desc": "Used 5+ programming languages", "icon": "terminal", "color": "#10B981", "xp": 250},
        {"id": "challenge_solver", "title": "Challenge Solver", "desc": "Completed 5 coding challenges", "icon": "star", "color": "#F59E0B", "xp": 300},
        {"id": "bug_hunter", "title": "Bug Hunter", "desc": "Fixed broken code", "icon": "bug", "color": "#EF4444", "xp": 200},
        {"id": "upgraded", "title": "Upgraded", "desc": "Subscribed to premium", "icon": "diamond", "color": "#8B5CF6", "xp": 200},
        {"id": "loyal_learner", "title": "Loyal Learner", "desc": "30-day subscription active", "icon": "time", "color": "#10B981", "xp": 500},
        {"id": "xp_collector", "title": "XP Collector", "desc": "Earned 10,000 XP total", "icon": "star", "color": "#F59E0B", "xp": 1000},
        {"id": "early_adopter", "title": "Early Adopter", "desc": "Joined during beta", "icon": "rocket", "color": "#06B6D4", "xp": 500},
        {"id": "referral_hero", "title": "Referral Hero", "desc": "Invited 5 successful users", "icon": "person-add", "color": "#3B82F6", "xp": 600},
        {"id": "night_owl", "title": "Night Owl", "desc": "Studied after midnight", "icon": "moon", "color": "#6B7280", "xp": 150},
        {"id": "explorer", "title": "Explorer", "desc": "Visited all features", "icon": "compass", "color": "#8B5CF6", "xp": 500},
        {"id": "master_student", "title": "Master Student", "desc": "Reached level 10", "icon": "trophy", "color": "#BE1A1A", "xp": 1000},
        {"id": "note_master", "title": "Note Master", "desc": "Created 100 study notes", "icon": "documents", "color": "#EC4899", "xp": 500},
        {"id": "ai_summary_legend", "title": "AI Summary Legend", "desc": "Generated 50 AI summaries", "icon": "flash", "color": "#06B6D4", "xp": 400},
        {"id": "bookmark_expert", "title": "Bookmark Expert", "desc": "Saved 50 bookmarks", "icon": "bookmark", "color": "#BE1A1A", "xp": 300},
        {"id": "vocab_master", "title": "Vocab Master", "desc": "Added 150 vocabulary terms", "icon": "library", "color": "#10B981", "xp": 500},
        {"id": "planner_champion", "title": "Planner Champion", "desc": "Completed 100 planner tasks", "icon": "flag", "color": "#10B981", "xp": 500},
        {"id": "social_butterfly", "title": "Social Butterfly", "desc": "Connected with 10 friends", "icon": "people", "color": "#8B5CF6", "xp": 300},
        {"id": "code_ninja", "title": "Code Ninja", "desc": "Executed 100 programs in playground", "icon": "terminal", "color": "#10B981", "xp": 500},
        {"id": "whiteboard_artist", "title": "Whiteboard Artist", "desc": "Saved 10 study drawings", "icon": "brush", "color": "#EC4899", "xp": 250},
        {"id": "grade_high", "title": "Straight A Student", "desc": "Logged 5 'A' grades in tracker", "icon": "school", "color": "#F59E0B", "xp": 400}
    ]
}

_seeding_lock = set()

def ensure_seeding(collection):
    name = collection.name
    if name in _seeding_lock:
        return
    _seeding_lock.add(name)
    try:
        if _orig_count_documents(collection, {}) == 0:
            from datetime import datetime
            data = SEED_DATA.get(name)
            if data:
                seeded = []
                for idx, doc in enumerate(data):
                    d = dict(doc)
                    d["created_at"] = datetime.utcnow()
                    d["is_demo"] = True
                    seeded.append(d)
                collection.insert_many(seeded)
    except Exception as e:
        print(f"[Mongodb Seed Error] Failed to seed collection {name}: {str(e)}")
    finally:
        _seeding_lock.remove(name)

# Monkeypatch read methods
_orig_find = Collection.find
_orig_find_one = Collection.find_one
_orig_count_documents = Collection.count_documents
_orig_aggregate = Collection.aggregate

def new_find(self, *args, **kwargs):
    ensure_seeding(self)
    return _orig_find(self, *args, **kwargs)

def new_find_one(self, *args, **kwargs):
    ensure_seeding(self)
    return _orig_find_one(self, *args, **kwargs)

def new_count_documents(self, *args, **kwargs):
    ensure_seeding(self)
    return _orig_count_documents(self, *args, **kwargs)

def new_aggregate(self, *args, **kwargs):
    ensure_seeding(self)
    return _orig_aggregate(self, *args, **kwargs)

Collection.find = new_find
Collection.find_one = new_find_one
Collection.count_documents = new_count_documents
Collection.aggregate = new_aggregate
