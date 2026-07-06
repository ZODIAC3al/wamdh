# AI Study OS — Full Production SKILL.md
> Complete specification for Antigravity to scaffold, build, and deploy a full-stack AI-powered mobile learning platform.

---

## 📌 Project Identity

**App Name:** وَمْض and in english also   
**Tagline:** Your AI-powered learning operating system  
**Platform:** React Native (Expo) + Django REST Framework + MongoDB  
**Target Users:** Students (high school, university, self-learners)  
**Roles:** Student, Instructor, Admin  
**AI Provider:** Google Gemini API (primary, free tier), HuggingFace Inference API (free fallback)  
**Cost Target:** $0 infrastructure (free tiers only)  
**Distribution:** Downloadable APK/IPA via marketing website + Expo Go preview

---

## 🎨 Design System

### Color Palette (from provided design reference)

```
Primary Violet:     #7C3AED   (main brand, buttons, CTAs)
Violet Light:       #A78BFA   (hover states, highlights)
Violet Soft:        #EDE9FE   (backgrounds, chips, tags)
Black Pill:         #1A1A2E   (primary buttons, dark mode surface)
Pure White:         #FFFFFF   (cards, modal backgrounds)
Off White:          #F4F4F8   (app background light)
Gray Text:          #6B7280   (subtitles, descriptions)
Gray Border:        #E5E7EB   (card borders, dividers)
Success Green:      #10B981   (CTA accents like "I want this", correct answers)
Error Red:          #EF4444   (wrong answers, errors)
Warning Amber:      #F59E0B   (medium difficulty, reminders)
```

### Dark Mode Overrides

```
Dark Background:    #0F0F1A
Dark Surface:       #1A1A2E
Dark Card:          #252540
Dark Border:        #2E2E50
Dark Text Primary:  #F3F4F6
Dark Text Muted:    #9CA3AF
Dark Violet:        #7C3AED   (unchanged)
```

### Typography

```
Display:      "Sora" (Google Fonts, bold headings — conveys intelligence + friendliness)
Body:         "Inter" (system fallback: -apple-system, clean readable body)
Mono/Data:    "JetBrains Mono" (code blocks, timer displays, scores)
```

### Illustration Style
- Clean black outlines with isolated violet/purple fill accents (matching design reference)
- Characters: faceless, minimal, action-oriented (studying, reading, running)
- Backgrounds: pure white cards, very light gray canvas
- Rounded corners: 16px cards, 12px inputs, 50px pill buttons

---

## 📱 React Native App — Full Specification

### Tech Stack

```
Framework:          Expo SDK 56 (managed workflow)
Language:           TypeScript
Styling:            NativeWind latest version (Tailwind CSS for React Native)
Navigation:         Expo Router (file-based, v3)
State:              Zustand (global), React Query (server state)
Forms:              React Hook Form + Zod
Auth:               JWT (access + refresh tokens stored in SecureStore)
File Upload:        expo-image-picker, expo-document-picker
Notifications:      expo-notifications
Storage:            expo-secure-store (tokens), AsyncStorage (cache)
Animations:         react-native-reanimated v3
Icons:              @expo/vector-icons (Ionicons set)
Charts:             victory-native (analytics)
Haptics:            expo-haptics
```

### NativeWind Setup

```bash
# Install
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context

# tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",
        "primary-light": "#A78BFA",
        "primary-soft": "#EDE9FE",
        surface: "#FFFFFF",
        background: "#F4F4F8",
        "gray-text": "#6B7280",
        success: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
        dark: {
          bg: "#0F0F1A",
          surface: "#1A1A2E",
          card: "#252540",
          border: "#2E2E50",
        },
      },
      fontFamily: {
        display: ["Sora_700Bold"],
        body: ["Inter_400Regular"],
        "body-medium": ["Inter_500Medium"],
        "body-bold": ["Inter_700Bold"],
        mono: ["JetBrainsMono_400Regular"],
      },
      borderRadius: {
        card: "16px",
        input: "12px",
        pill: "50px",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
```

### App Directory Structure (Expo Router)

```
app/
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding.tsx
├── (student)/
│   ├── _layout.tsx          # Bottom tabs
│   ├── index.tsx            # Home Dashboard
│   ├── notes/
│   │   ├── index.tsx        # Notes Library
│   │   ├── [id].tsx         # Note Viewer
│   │   └── upload.tsx       # Upload Screen
│   ├── ai/
│   │   ├── chat.tsx         # AI Tutor Chat
│   │   ├── summarize.tsx    # Summary Generator
│   │   └── search.tsx       # Semantic Search
│   ├── quiz/
│   │   ├── index.tsx        # Quiz List
│   │   ├── [id].tsx         # Quiz Session
│   │   └── results.tsx      # Results Screen
│   ├── flashcards/
│   │   ├── index.tsx        # Flashcard Decks
│   │   └── [id].tsx         # Review Session
│   ├── planner/
│   │   ├── index.tsx        # Study Planner
│   │   └── today.tsx        # Today's Tasks
│   ├── analytics/
│   │   └── index.tsx        # Analytics Dashboard
│   └── profile/
│       ├── index.tsx        # My Profile
│       └── edit.tsx         # Edit Profile
├── (instructor)/
│   ├── _layout.tsx
│   ├── index.tsx            # Instructor Dashboard
│   ├── courses/
│   │   ├── index.tsx        # My Courses
│   │   ├── create.tsx       # Create Course
│   │   └── [id].tsx         # Course Detail
│   ├── students/
│   │   └── index.tsx        # My Students
│   └── profile/
│       └── index.tsx
├── (admin)/
│   ├── _layout.tsx
│   ├── index.tsx            # Admin Dashboard
│   ├── users/
│   │   ├── index.tsx        # All Users
│   │   └── [id].tsx         # User Detail
│   ├── reports/
│   │   └── index.tsx        # Platform Analytics
│   └── profile/
│       └── index.tsx
└── _layout.tsx              # Root layout (auth guard, theme provider)
```

---

## 👤 User Roles & Permissions

### Role: Student
- Upload notes (PDF, image, text)
- Generate summaries, quizzes, flashcards
- Chat with AI tutor
- Use study planner
- View personal analytics
- Upload profile photo
- Follow instructors

### Role: Instructor
- All Student permissions
- Create public/private courses
- Assign quizzes to students
- View student progress and analytics
- Upload course materials
- Upload profile photo + banner image
- Receive student messages

### Role: Admin
- Full platform access
- Manage all users (CRUD, role assignment, bans)
- View global analytics dashboard
- Manage AI usage and quotas
- View content moderation flags
- Upload profile photo
- Configure system settings

---

## 📸 Image Upload Specification

### Profile Picture
- Endpoint: `PATCH /api/users/profile/`
- Field: `profile_photo` (multipart/form-data)
- Allowed: `.jpg`, `.jpeg`, `.png`, `.webp`
- Max size: 5MB
- Backend: Cloudinary free tier (or local `/media/` folder if Cloudinary not needed)
- Storage: `users` collection → `profile_photo_url` field
- Frontend: `expo-image-picker` with circular crop preview

### Instructor Banner
- Endpoint: `PATCH /api/users/profile/`
- Field: `banner_image` (multipart/form-data)
- Dimensions: 1200×400px recommended
- Storage: Cloudinary or local `/media/`

### Note/Document Upload
- Endpoint: `POST /api/notes/upload/`
- Fields: `file` (PDF or image), `subject`, `tags`, `title`
- Allowed: `.pdf`, `.jpg`, `.jpeg`, `.png`
- Max size: 20MB
- OCR: tesseract or Gemini Vision for images

### Course Thumbnail (Instructor)
- Endpoint: `POST /api/courses/`
- Field: `thumbnail` (multipart/form-data)

---

## 📱 Screen Designs

### Auth Screens (matches design reference)
```
Layout: Single centered card on light off-white (#F4F4F8) background
Illustration: Top 40% — character illustration with violet accent
Headline: Large Sora Bold, center-aligned
Subtext: Inter Regular, gray-text color
CTA: Full-width pill button, black (#1A1A2E) background, white text
Secondary link: violet underline text
```

### Home Dashboard (Student)
```
Header:         Avatar + "Good morning, [Name]" + notification bell
Streak Banner:  Violet gradient card showing daily streak + XP
Quick Actions:  2×2 grid — Upload Note, Start Quiz, AI Chat, Flashcards
Today's Plan:   Horizontal scroll list of today's tasks
Recent Notes:   Vertical cards with subject color tags
Progress Ring:  Weekly goal circular progress
```

### Note Viewer
```
Header:         Back arrow + note title + share icon
Content:        Scrollable rendered text with paragraph spacing
Action Bar:     Fixed bottom — Summarize | Quiz | Flashcard | Chat
AI Overlay:     Slide-up sheet for AI results
```

### AI Chat Tutor
```
Layout:         Full screen chat interface
Messages:       User bubbles (violet right), AI bubbles (white card left)
Input:          Bottom text input + send button + attach icon
Features:       "Explain like I'm 12" toggle, context-aware (loads current note)
Empty State:    Illustration + "Ask me anything about your notes"
```

### Quiz Screen
```
Progress:       Top progress bar (violet fill)
Timer:          Mono font countdown (top right)
Question Card:  White card, large body text
Options:        Radio-style vertical list, tap to select
                Correct = success green border, Wrong = error red border
                With explanation panel slide-up after answer
Navigation:     Next button (pill, violet) + prev arrow
Results:        Score donut chart + per-question breakdown
```

### Flashcard Review
```
Card:           Full-screen flip card (front = question, back = answer)
Flip:           Tap card = 3D flip animation (reanimated)
Rating:         Bottom row — Again | Hard | Good | Easy (color-coded)
Progress:       Top bar + "X cards remaining"
```

### Study Planner
```
Input Form:     Exam date picker, subject multi-select, daily hours slider
Output:         Calendar-style week view with colored subject blocks
Today View:     Vertical checklist of today's sessions with time blocks
Adjustment:     AI re-generates plan if topics are skipped
```

### Analytics Dashboard
```
Top Stats:      3-column — Study Hours | Quizzes Taken | Avg Score
Charts:         Line chart (weekly study time), Bar chart (quiz accuracy by subject)
Weak Topics:    Red-tagged chip list of topics below 60% accuracy
Streak:         GitHub-style contribution calendar (heatmap)
Subject Cards:  Progress bars per subject
```

### Profile Screen
```
Header:         Banner image (instructor/admin) or violet gradient (student)
Avatar:         Circular photo with camera edit icon overlay
Name + Role:    Sora Bold + colored role badge pill
Stats Row:      Notes | Quizzes | Streak
Edit Button:    Pill outline button
Sections:       My Notes, My Quizzes, Settings, Dark Mode toggle, Logout
```

### Admin Dashboard
```
Global Stats:   Total users, active today, notes processed, AI calls used
User Table:     Searchable list with role badges + ban/promote actions
AI Usage:       Gemini calls meter (free tier limit tracker)
Reports:        Subject popularity, average performance
```

---

## 🧠 AI Features — Implementation

### Gemini Free Tier Integration

```python
# config/ai.py
import google.generativeai as genai

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")  # Free tier model

def call_gemini(prompt: str, max_tokens: int = 2048) -> str:
    response = model.generate_content(prompt)
    return response.text
```

### HuggingFace Fallback

```python
import requests

HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
HF_HEADERS = {"Authorization": f"Bearer {settings.HF_API_KEY}"}

def call_huggingface(text: str) -> str:
    payload = {"inputs": text, "parameters": {"max_length": 500}}
    response = requests.post(HF_API_URL, headers=HF_HEADERS, json=payload)
    return response.json()[0]["summary_text"]
```

### RAG System (MongoDB Atlas Vector Search — Free Tier)

```python
# embeddings via sentence-transformers (free, local)
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")

def embed_chunk(text: str) -> list[float]:
    return embedder.encode(text).tolist()

# Store in MongoDB with vector
{
  "note_id": ObjectId("..."),
  "chunk_text": "...",
  "embedding": [0.12, -0.45, ...],  # 384 dims
  "metadata": {"subject": "Math", "topic": "Calculus"}
}

# Atlas Search Index (free M0 cluster supports vector search)
{
  "mappings": {
    "fields": {
      "embedding": [{
        "type": "knnVector",
        "dimensions": 384,
        "similarity": "cosine"
      }]
    }
  }
}
```

### AI Pipeline Prompts

```python
# Summarization
SUMMARY_PROMPTS = {
    "short": "Summarize the following text in 5 bullet points:\n\n{text}",
    "medium": "Write a 3-paragraph explanation of the following content for a student:\n\n{text}",
    "detailed": "Create a structured study guide with: Key Concepts, Definitions, Formulas, and Summary for:\n\n{text}",
}

# Quiz Generation
QUIZ_PROMPT = """
Generate {count} {difficulty} {type} questions from this content.
Return JSON only in this format:
[{{"question": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "..."}}]

Content:
{text}
"""

# Flashcard Generation
FLASHCARD_PROMPT = """
Extract {count} key facts from this content and format as flashcards.
Return JSON only:
[{{"front": "What is...", "back": "It is..."}}]

Content:
{text}
"""

# Study Plan Generation
PLAN_PROMPT = """
Create a daily study plan for a student.
Subjects: {subjects}
Exam Date: {exam_date}
Daily Hours: {hours}
Today: {today}

Return JSON:
{{"days": [{{"date": "YYYY-MM-DD", "tasks": [{{"subject": "...", "topic": "...", "duration_mins": 45}}]}}]}}
"""
```

---

## 🧱 Django REST Framework — Full Backend

### Project Structure

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── permissions.py
│   ├── notes/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── ai_engine/
│   │   ├── gemini.py
│   │   ├── huggingface.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── rag/
│   │   ├── embedder.py
│   │   ├── search.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── quiz/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── flashcards/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── planner/
│   │   ├── views.py
│   │   └── urls.py
│   └── analytics/
│       ├── models.py
│       ├── views.py
│       └── urls.py
├── requirements.txt
├── manage.py
└── Dockerfile
```

### settings/base.py

```python
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
DEBUG = False

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "djongo",  # MongoDB ODM
    # Apps
    "apps.users",
    "apps.notes",
    "apps.ai_engine",
    "apps.rag",
    "apps.quiz",
    "apps.flashcards",
    "apps.planner",
    "apps.analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

DATABASES = {
    "default": {
        "ENGINE": "djongo",
        "NAME": os.environ.get("MONGO_DB_NAME", "ai_study_os"),
        "CLIENT": {
            "host": os.environ.get("MONGO_URI", "mongodb://localhost:27017"),
        },
    }
}

AUTH_USER_MODEL = "users.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
}

CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Cloudinary (optional, free tier)
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
    "API_KEY": os.environ.get("CLOUDINARY_API_KEY", ""),
    "API_SECRET": os.environ.get("CLOUDINARY_API_SECRET", ""),
}

# AI Keys
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
HF_API_KEY = os.environ.get("HF_API_KEY", "")

# File upload limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
```

### MongoDB Collections / Models

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLES = [("student", "Student"), ("instructor", "Instructor"), ("admin", "Admin")]
    
    role = models.CharField(max_length=20, choices=ROLES, default="student")
    profile_photo_url = models.URLField(blank=True)
    banner_image_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    subjects_of_interest = models.JSONField(default=list)
    xp_points = models.IntegerField(default=0)
    streak_days = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    is_banned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

# apps/notes/models.py
class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list)
    raw_text = models.TextField()
    file_url = models.URLField(blank=True)
    file_type = models.CharField(max_length=20)  # pdf, image, text
    chunks = models.JSONField(default=list)  # list of text chunks
    word_count = models.IntegerField(default=0)
    is_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Embedding(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE)
    chunk_index = models.IntegerField()
    chunk_text = models.TextField()
    embedding_vector = models.JSONField()  # 384-dim list
    created_at = models.DateTimeField(auto_now_add=True)

# apps/quiz/models.py
class Quiz(models.Model):
    DIFFICULTY = [("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")]
    QTYPES = [("mcq", "MCQ"), ("tf", "True/False"), ("short", "Short Answer")]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.ForeignKey(Note, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY)
    question_type = models.CharField(max_length=10, choices=QTYPES)
    questions = models.JSONField()  # list of question objects
    time_limit_minutes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    answers = models.JSONField()
    score = models.FloatField()
    time_taken_seconds = models.IntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)

# apps/flashcards/models.py
class FlashcardDeck(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.ForeignKey(Note, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

class Flashcard(models.Model):
    RATINGS = [("again", "Again"), ("hard", "Hard"), ("good", "Good"), ("easy", "Easy")]
    
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE)
    front = models.TextField()
    back = models.TextField()
    # SM-2 fields
    ease_factor = models.FloatField(default=2.5)
    interval_days = models.IntegerField(default=1)
    repetitions = models.IntegerField(default=0)
    next_review = models.DateField(auto_now_add=True)
    last_rating = models.CharField(max_length=10, choices=RATINGS, blank=True)

# apps/analytics/models.py
class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    duration_minutes = models.IntegerField()
    activity_type = models.CharField(max_length=20)  # note, quiz, flashcard, chat
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### Full API Endpoints

```
# Authentication
POST   /api/auth/register/          Register new user
POST   /api/auth/login/             Login → returns access + refresh tokens
POST   /api/auth/refresh/           Refresh access token
POST   /api/auth/logout/            Blacklist refresh token
POST   /api/auth/password/change/   Change password

# Users / Profile
GET    /api/users/profile/          Get my profile
PATCH  /api/users/profile/          Update profile (name, bio, subjects)
POST   /api/users/profile/photo/    Upload profile photo
POST   /api/users/profile/banner/   Upload banner image (instructor/admin)
GET    /api/users/profile/{id}/     Get any user's public profile

# Admin — User Management
GET    /api/admin/users/            List all users (paginated, filterable by role)
GET    /api/admin/users/{id}/       Get user detail
PATCH  /api/admin/users/{id}/       Update role, ban status
DELETE /api/admin/users/{id}/       Delete user
GET    /api/admin/stats/            Platform-wide analytics

# Notes
POST   /api/notes/upload/           Upload PDF/image/text (multipart)
GET    /api/notes/                  List my notes (filter: subject, tags, search)
GET    /api/notes/{id}/             Get note detail + chunks
PATCH  /api/notes/{id}/             Update title, subject, tags
DELETE /api/notes/{id}/             Delete note
GET    /api/notes/subjects/         List distinct subjects for current user

# AI Engine
POST   /api/ai/summarize/           Generate summary
                                    Body: {note_id, mode: "short"|"medium"|"detailed"}
POST   /api/ai/quiz/                Generate quiz from note
                                    Body: {note_id, count, difficulty, type}
POST   /api/ai/flashcards/          Generate flashcards from note
                                    Body: {note_id, count}
POST   /api/ai/chat/                Chat with AI tutor (RAG)
                                    Body: {message, note_id?, conversation_history: []}
POST   /api/ai/search/              Semantic search across notes
                                    Body: {query, limit: 10}

# Quiz
GET    /api/quiz/                   List my quizzes
GET    /api/quiz/{id}/              Get quiz with questions
POST   /api/quiz/{id}/attempt/      Submit quiz attempt
                                    Body: {answers: [{question_index, answer}], time_taken}
GET    /api/quiz/{id}/attempts/     Get attempt history for a quiz
GET    /api/quiz/stats/             Quiz performance stats

# Flashcards
GET    /api/flashcards/             List my decks
POST   /api/flashcards/             Create deck manually
GET    /api/flashcards/{id}/        Get deck with cards
GET    /api/flashcards/{id}/review/ Get due cards for today's review
POST   /api/flashcards/{id}/rate/   Rate a card (SM-2 update)
                                    Body: {card_id, rating: "again"|"hard"|"good"|"easy"}
POST   /api/flashcards/cards/       Add card to deck manually

# Study Planner
POST   /api/planner/generate/       Generate study plan
                                    Body: {subjects, exam_date, daily_hours}
GET    /api/planner/                Get current plan
GET    /api/planner/today/          Get today's tasks
PATCH  /api/planner/task/{id}/      Mark task complete/skip → triggers re-generation

# Analytics
GET    /api/analytics/summary/      Overview stats
GET    /api/analytics/weekly/       Weekly study time chart data
GET    /api/analytics/subjects/     Per-subject accuracy + time
GET    /api/analytics/weak-topics/  Topics below 60% accuracy
POST   /api/analytics/session/      Log a study session
                                    Body: {subject, duration_minutes, activity_type}

# Instructor
GET    /api/instructor/courses/     List my courses
POST   /api/instructor/courses/     Create course
GET    /api/instructor/courses/{id}/ Course detail
PATCH  /api/instructor/courses/{id}/ Update course
POST   /api/instructor/courses/{id}/thumbnail/ Upload thumbnail
GET    /api/instructor/students/    Students following me
GET    /api/instructor/analytics/   My students' aggregate stats
```

### Custom Permissions

```python
# apps/users/permissions.py
from rest_framework.permissions import BasePermission

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "student"

class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ["instructor", "admin"]

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "admin"

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.role == "admin"
```

### Note Processing Pipeline

```python
# apps/notes/processor.py
import fitz  # PyMuPDF (free, no API)
import pytesseract  # OCR (free, local)
from PIL import Image
import textwrap

def extract_text_from_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    return "\n".join(page.get_text() for page in doc)

def extract_text_from_image(file_path: str) -> str:
    img = Image.open(file_path)
    return pytesseract.image_to_string(img)

def clean_text(text: str) -> str:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return "\n".join(lines)

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks
```

### SM-2 Spaced Repetition

```python
# apps/flashcards/sm2.py
from datetime import date, timedelta

RATING_MAP = {"again": 0, "hard": 1, "good": 3, "easy": 5}

def update_card(card, rating_str: str):
    q = RATING_MAP[rating_str]
    if q >= 3:
        if card.repetitions == 0:
            card.interval_days = 1
        elif card.repetitions == 1:
            card.interval_days = 6
        else:
            card.interval_days = round(card.interval_days * card.ease_factor)
        card.repetitions += 1
    else:
        card.repetitions = 0
        card.interval_days = 1
    
    card.ease_factor = max(1.3, card.ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    card.next_review = date.today() + timedelta(days=card.interval_days)
    card.last_rating = rating_str
    card.save()
    return card
```

---

## 🌐 Marketing Website

### Purpose
Landing page where users can:
- Download the Expo Go QR code (scan to preview app)
- Download the Android APK (direct link)
- Download iOS TestFlight link
- View feature highlights
- Sign up for beta access

### Tech Stack
```
Framework:    Next.js 14 (App Router, static export)
Styling:      Tailwind CSS
Hosting:      Vercel (free tier)
Domain:       Vercel subdomain or custom
```

### Pages
```
/              Landing page (hero, features, download CTAs)
/download      SDK downloads page — APK, TestFlight, Expo Go QR
/features      Full feature showcase
/pricing       Free (all features, forever) — no paywall
/changelog     Release notes
```

### Landing Page Sections

```
1. Hero
   - Headline: "Study Smarter. Not Harder."
   - Sub: "AI-powered notes, quizzes, flashcards, and a personal tutor — all in one app."
   - CTA buttons: [Download for Android] [Preview on Expo Go]
   - Phone mockup showing app with violet UI

2. Features Grid (6 cards)
   - Smart Notes → AI Summaries → Quiz Generator → Flashcards → Study Planner → AI Tutor

3. How It Works (3 steps)
   - Upload your notes
   - AI processes everything
   - Learn, quiz, review

4. Download Section
   - Android APK button
   - Expo Go QR code (for preview)
   - TestFlight link (iOS)

5. Footer
   - Logo + tagline + links (Privacy, Terms, Contact)
```

### Download Page (SDK page)

```jsx
// app/download/page.tsx
export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F8] flex flex-col items-center justify-center py-20 px-4">
      <h1 className="font-display text-4xl font-bold text-[#1A1A2E] mb-4">
        Get AI Study OS
      </h1>
      <p className="text-[#6B7280] text-lg mb-12 text-center max-w-md">
        Available on Android and iOS. Scan to preview instantly with Expo Go.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {/* Android APK */}
        <DownloadCard
          icon="🤖"
          title="Android"
          description="Download APK directly to your device"
          buttonText="Download APK"
          href="/downloads/ai-study-os.apk"
        />
        {/* iOS TestFlight */}
        <DownloadCard
          icon="🍎"
          title="iOS"
          description="Join TestFlight beta to install on iPhone"
          buttonText="Open TestFlight"
          href="https://testflight.apple.com/join/YOUR_LINK"
        />
        {/* Expo Go */}
        <DownloadCard
          icon="📱"
          title="Preview"
          description="Scan QR code with Expo Go app"
          qrCode={true}
          qrUrl="exp://your-expo-url"
        />
      </div>
    </main>
  )
}
```

### Building the APK (Zero Cost)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# eas.json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"  # Direct APK for sideloading, no Play Store needed
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}

# Build APK (free on EAS, 30 builds/month on free plan)
eas build -p android --profile preview

# Output: APK download URL → host on Vercel /public/downloads/
```

---

## 🔒 Security

```python
# Rate limiting (free, using django-ratelimit)
from django_ratelimit.decorators import ratelimit

@ratelimit(key="user", rate="10/m", method="POST", block=True)
def ai_chat_view(request):
    ...

# JWT token rotation enabled
# HTTPS enforced in production
# File type validation on upload
# Max file size enforced
# MongoDB injection prevention via djongo ORM
# CORS restricted to known origins
# Admin endpoints require role=admin in JWT claims
```

---

## 🚀 Free Tier Infrastructure Plan

| Service | Provider | Free Tier |
|---|---|---|
| MongoDB | Atlas M0 | 512MB storage, shared |
| App hosting | Railway.app | $5 free credit / month |
| Web hosting | Vercel | Free forever |
| APK builds | Expo EAS | 30 builds/month |
| AI (primary) | Google Gemini | 15 RPM, 1M tokens/day |
| AI (fallback) | HuggingFace | Free inference API |
| Embeddings | sentence-transformers | Runs locally on server |
| File storage | Cloudinary | 25GB free |
| OCR | Tesseract (local) | Free, open-source |
| CI/CD | GitHub Actions | 2000 min/month free |

**Total monthly cost: $0**

---

## 📦 Required Packages

### React Native (package.json)

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.1",
    "expo-image-picker": "~15.0.5",
    "expo-document-picker": "~12.0.1",
    "expo-secure-store": "~13.0.1",
    "expo-notifications": "~0.28.9",
    "expo-haptics": "~13.0.1",
    "expo-font": "~12.0.6",
    "expo-splash-screen": "~0.27.4",
    "react-native": "0.74.0",
    "react-native-reanimated": "~3.10.1",
    "react-native-safe-area-context": "4.10.1",
    "react-native-screens": "3.31.1",
    "react-native-gesture-handler": "~2.16.1",
    "nativewind": "^4.0.1",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.2",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "axios": "^1.6.8",
    "victory-native": "^41.6.0",
    "@expo-google-fonts/sora": "^0.2.3",
    "@expo-google-fonts/inter": "^0.2.3",
    "@shopify/flash-list": "^1.6.3"
  }
}
```

### Django (requirements.txt)

```txt
Django==5.0.4
djangorestframework==3.15.1
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
djongo==1.3.6
pymongo==3.12.3
Pillow==10.3.0
PyMuPDF==1.24.1
pytesseract==0.3.10
sentence-transformers==2.7.0
google-generativeai==0.5.4
requests==2.31.0
django-ratelimit==4.1.0
python-dotenv==1.0.1
gunicorn==22.0.0
whitenoise==6.6.0
cloudinary==1.40.0
django-cloudinary-storage==0.3.0
```

---

## 🌍 Environment Variables

```env
# .env (backend)
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGO_DB_NAME=ai_study_os
GEMINI_API_KEY=your-gemini-key
HF_API_KEY=your-hf-token
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# .env (React Native / Expo)
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
EXPO_PUBLIC_APP_NAME=AI Study OS
```

---

## 🧪 Testing Plan

```python
# Each app needs:
# - Unit tests for models (pytest-django)
# - Integration tests for API endpoints
# - AI mock tests (mock Gemini responses)

# apps/ai_engine/tests.py
from unittest.mock import patch
from rest_framework.test import APITestCase

class SummarizeTest(APITestCase):
    @patch("apps.ai_engine.gemini.call_gemini")
    def test_summarize_short(self, mock_gemini):
        mock_gemini.return_value = "• Point 1\n• Point 2"
        response = self.client.post("/api/ai/summarize/", {
            "note_id": "...",
            "mode": "short"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("summary", response.data)
```

---

## 📋 Development Checklist

### Phase 1 — Foundation (Week 1-2)
- [ ] Scaffold Django project with MongoDB connection
- [ ] Build User model with roles + JWT auth
- [ ] Build Notes upload + text extraction pipeline
- [ ] Scaffold Expo app with NativeWind + Expo Router
- [ ] Build Auth screens (Login, Register, Onboarding)
- [ ] Build profile screen with image upload

### Phase 2 — Core AI Features (Week 3-4)
- [ ] Integrate Gemini API for summarization
- [ ] Build quiz generation endpoint + screen
- [ ] Build flashcard generation + SM-2 engine
- [ ] Build RAG system (embeddings + MongoDB vector search)
- [ ] Build AI Chat screen

### Phase 3 — Planner + Analytics (Week 5)
- [ ] Build study planner generation
- [ ] Build analytics endpoints + dashboard screen
- [ ] Implement streak tracking
- [ ] Implement notifications (expo-notifications)

### Phase 4 — Roles + Admin (Week 6)
- [ ] Build Admin dashboard screen
- [ ] Build Instructor course system
- [ ] Add role-based navigation guards
- [ ] Add user management for Admin

### Phase 5 — Marketing Site + Distribution (Week 7)
- [ ] Build Next.js marketing site
- [ ] Build APK with EAS
- [ ] Upload APK to Vercel public folder
- [ ] Generate Expo Go QR code
- [ ] Launch TestFlight beta

### Phase 6 — Polish (Week 8)
- [ ] Dark mode full pass
- [ ] Animations (react-native-reanimated)
- [ ] Error states + empty states for every screen
- [ ] Accessibility (a11y) pass
- [ ] Performance optimization (FlashList, Query caching)

---

## 🎯 Additional Suggested Features (Not in Original Spec)

1. **Collaborative Notes** — Share notes with classmates or follow instructor's shared notes
2. **Voice Input** — Record voice notes → transcribed via Whisper API (HuggingFace free)
3. **Formula Renderer** — LaTeX math rendering in notes viewer using `react-native-math-view`
4. **Difficulty Heatmap** — Calendar view showing which days were hard (red) vs easy (green)
5. **Offline Mode** — Cache last 20 notes + flashcard decks with AsyncStorage for offline review
6. **XP + Badges** — Gamification system: earn XP for quizzes, streaks, flashcard reviews → unlock badges
7. **AI Writing Tutor** — Paste your essay → get structure feedback, grammar, citation suggestions
8. **Focus Timer** — Pomodoro timer screen integrated with planner tasks
9. **Export** — Export notes as PDF / quiz results as CSV
10. **Note Sharing** — Generate public share link for a note's summary (web preview)

---

# 🏗 Dynamic Role-Based UI Architecture

This section defines the **production-grade specification** for the Wamdh EdTech ecosystem. Wamdh is not a single-purpose study app — it is a complete platform spanning **AI Learning**, **Social Learning**, **Instructor Teaching**, and **Admin Management**. Every screen, widget, route, and data source described here is authoritative for implementation.

---

## 🔑 1. Role-Based UI & Routing

The application uses **Role-Based UI Rendering**. After login, the backend returns the authenticated user's role claim inside the JWT payload. The frontend reads this claim and loads a role-specific navigation layout — never mixing Student, Instructor, and Admin UI trees.

### Supported Roles

| Role | Route Group | Entry Point |
| :--- | :--- | :--- |
| **Student** | `(student)` | `/(student)` |
| **Instructor** | `(instructor)` | `/(instructor)` |
| **Admin** | `(admin)` | `/(admin)` |

### Post-Login Redirection

```typescript
// Role-based routing after authentication
if (user.role === "student") router.replace("/(student)");
if (user.role === "instructor") router.replace("/(instructor)");
if (user.role === "admin") router.replace("/(admin)");
```

### Root Auth Guard (`app/_layout.tsx`)

The root layout enforces three rules on every navigation change:

1. **Unauthenticated users** → redirect to `/(auth)/login`
2. **Authenticated users in wrong role group** → redirect to `/(role)`
3. **Role escalation blocked** → backend JWT claims are the source of truth; frontend guards are defense-in-depth only

```typescript
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const { user, token, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token || !user) {
      if (!inAuthGroup) router.replace("/(auth)/login");
    } else {
      const targetGroup = `(${user.role})`;
      if (segments[0] !== targetGroup) {
        router.replace(`/${targetGroup}` as any);
      }
    }
  }, [token, user, segments, initialized]);
}
```

### Role Scope Boundaries

| Role | UI Scope | Backend Policy |
| :--- | :--- | :--- |
| **Student** | Personal notes, AI tutor, messages, profile, Hub tools | `IsStudent` permission on student-only endpoints |
| **Instructor** | Courses, enrolled students, announcements, messages | `IsInstructor` permission; no admin endpoints |
| **Admin** | Users, analytics, reports, system settings | `IsAdmin` permission; full platform CRUD |

---

## 📱 2. Bottom Tabs Navigation (Strict 5-Tab Layout)

Every role sees **exactly five bottom tabs**. No sixth tab. No overflow menu in the tab bar. All advanced features live inside the **Wamdh App Hub** (Section 3).

### Tab Matrix

| # | 👨‍🎓 Student | 👨‍🏫 Instructor | 👑 Admin |
| :---: | :--- | :--- | :--- |
| 1 | **Home** | **Dashboard** | **Dashboard** |
| 2 | **Notes** | **Courses** | **Users** |
| 3 | **AI Tutor** | **Students** | **Analytics** |
| 4 | **Messages** | **Messages** | **Reports** |
| 5 | **Profile** | **Profile** | **Profile** |

### Expo Router Tab Layouts

```
app/
├── (student)/
│   └── _layout.tsx    # Tabs: Home | Notes | AI Tutor | Messages | Profile
├── (instructor)/
│   └── _layout.tsx    # Tabs: Dashboard | Courses | Students | Messages | Profile
└── (admin)/
    └── _layout.tsx    # Tabs: Dashboard | Users | Analytics | Reports | Profile
```

### Tab Icon & Route Mapping

| Role | Tab | Route | Icon (Ionicons) |
| :--- | :--- | :--- | :--- |
| Student | Home | `/(student)/index` | `home-outline` |
| Student | Notes | `/(student)/notes` | `document-text-outline` |
| Student | AI Tutor | `/(student)/ai/chat` | `sparkles-outline` |
| Student | Messages | `/(student)/messages` | `chatbubbles-outline` |
| Student | Profile | `/(student)/profile` | `person-outline` |
| Instructor | Dashboard | `/(instructor)/index` | `grid-outline` |
| Instructor | Courses | `/(instructor)/courses` | `book-outline` |
| Instructor | Students | `/(instructor)/students` | `people-outline` |
| Instructor | Messages | `/(instructor)/messages` | `chatbubbles-outline` |
| Instructor | Profile | `/(instructor)/profile` | `person-outline` |
| Admin | Dashboard | `/(admin)/index` | `speedometer-outline` |
| Admin | Users | `/(admin)/users` | `people-outline` |
| Admin | Analytics | `/(admin)/analytics` | `bar-chart-outline` |
| Admin | Reports | `/(admin)/reports` | `flag-outline` |
| Admin | Profile | `/(admin)/profile` | `person-outline` |

---

## 🌟 3. Wamdh App Hub (Mini-App Store)

The **Wamdh App Hub** (وامض Hub) is the centralized tools center — a mini-app store inside the platform. Any feature that does not belong in the five primary tabs lives here.

### Hub Concept

- Acts as a **mini-app store** and **tools center**
- Groups all advanced, secondary, and role-specific utilities in one place
- Each Hub tile navigates to a dedicated stack screen outside the tab bar

### Entry Points

| Trigger | Location | Applies To |
| :--- | :--- | :--- |
| **Floating Action Button (FAB)** | Bottom-right of Home/Dashboard screen | Student, Instructor |
| **Hub Header Button** | Top-right grid icon in screen header | All roles |

### Hub Feature Catalog

#### 👨‍🎓 Student Hub

| Mini-App | Description | Route |
| :--- | :--- | :--- |
| Quiz Center | Take and review AI-generated quizzes | `/(student)/hub/quiz` |
| Flashcards | SM-2 spaced repetition decks | `/(student)/hub/flashcards` |
| Study Planner | AI-generated daily study schedule | `/(student)/hub/planner` |
| Analytics | Personal study time and accuracy charts | `/(student)/hub/analytics` |
| AI Search | Semantic search across all notes | `/(student)/hub/search` |
| XP & Badges | Gamification progress and achievements | `/(student)/hub/xp` |
| Focus Timer | Pomodoro timer linked to planner tasks | `/(student)/hub/focus` |
| Downloads | Offline-cached notes and decks | `/(student)/hub/downloads` |

#### 👨‍🏫 Instructor Hub

| Mini-App | Description | Route |
| :--- | :--- | :--- |
| Quiz Builder | Create and assign quizzes to students | `/(instructor)/hub/quiz-builder` |
| Assignments | Create, distribute, and grade assignments | `/(instructor)/hub/assignments` |
| Course Analytics | Per-course performance breakdowns | `/(instructor)/hub/course-analytics` |
| Announcements | Broadcast messages to course groups | `/(instructor)/hub/announcements` |
| AI Lesson Generator | Generate lecture content from materials | `/(instructor)/hub/lesson-gen` |
| Exam Creator | Build timed exams with question banks | `/(instructor)/hub/exam-creator` |

#### 👑 Admin Hub

| Mini-App | Description | Route |
| :--- | :--- | :--- |
| AI Usage Monitor | Gemini/HF call meters and quota tracking | `/(admin)/hub/ai-monitor` |
| System Settings | Platform-wide configuration | `/(admin)/hub/settings` |
| Security Center | Auth logs, failed logins, IP blocks | `/(admin)/hub/security` |
| Logs | Application and error audit logs | `/(admin)/hub/logs` |
| Storage Analytics | MongoDB and Cloudinary usage stats | `/(admin)/hub/storage` |
| Moderation Tools | Content review queue and actions | `/(admin)/hub/moderation` |

---

## 🎨 4. UI Screen Specifications (All Roles)

All screen data is fetched dynamically from MongoDB via React Query hooks. **Zero hardcoded placeholder arrays, mock users, or static demo content.**

---

### 👨‍🎓 Student UI

#### 4.1 Home Screen (`/(student)/index`)

**Displays:**
- Time-based greeting (`Good morning, [Name]`)
- Streak counter with flame icon
- XP progress bar
- Daily tasks checklist (from planner API)
- Quick action grid
- Recent notes feed (last 3 from MongoDB)

**Widgets:**

| Widget | Data Source | Actions |
| :--- | :--- | :--- |
| Greeting Header | `GET /api/users/profile/` | Tap avatar → Profile |
| Streak & XP Banner | `GET /api/analytics/summary/` | Tap → Hub XP & Badges |
| Daily Tasks | `GET /api/planner/today/` | Tap task → mark complete |
| Upload Note CTA | — | Navigate to upload screen |
| Continue Studying | `GET /api/notes/?recent=true` | Tap note → Note Viewer |
| AI Suggestions | `GET /api/ai/suggestions/` | Tap → AI Tutor with context |
| Recent Notes Feed | `GET /api/notes/?limit=3` | Tap → Note Viewer |
| Wamdh Hub FAB | — | Open Hub overlay |

#### 4.2 Notes Screen (`/(student)/notes`)

**Displays:**
- All uploaded notes (paginated)
- Search bar (real-time MongoDB text filter)
- Subject filter chips
- Subject grouping sections

**Actions:**

| Action | Trigger | API |
| :--- | :--- | :--- |
| Open note | Tap card | `GET /api/notes/{id}/` |
| Edit note | Swipe → Edit | `PATCH /api/notes/{id}/` |
| Delete note | Swipe → Delete | `DELETE /api/notes/{id}/` |
| Upload note | FAB `+` | `POST /api/notes/upload/` |
| AI Summarize | Long-press → AI menu | `POST /api/ai/summarize/` |
| AI Quiz | Long-press → AI menu | `POST /api/ai/quiz/` |
| AI Flashcards | Long-press → AI menu | `POST /api/ai/flashcards/` |

#### 4.3 AI Tutor Screen (`/(student)/ai/chat`)

**Displays:**
- Full-screen chat interface
- Context indicator (linked note, if any)
- Mode selector chips

**Features:**

| Feature | Description |
| :--- | :--- |
| Ask AI | General knowledge questions via RAG |
| Ask Notes | Query scoped to a specific note's chunks |
| Summaries | Inline summary generation from chat |
| Exam Prep | Exam-mode responses with practice questions |

**Modes:**

| Mode | Behavior |
| :--- | :--- |
| **Simple** | Short, concise answers (≤ 3 sentences) |
| **Detailed** | Structured explanations with headings |
| **Exam Mode** | Practice questions + scoring feedback |

**API:** `POST /api/ai/chat/` with `{ message, note_id?, mode, conversation_history }`

#### 4.4 Messages Screen (`/(student)/messages`)

**Displays:**
- Friends list tab
- Group chats tab
- Search bar (users and conversations)
- Recent chats sorted by `last_message.created_at`

**Actions:** Start new chat, accept/decline friend requests, create study group

#### 4.5 Profile Screen (`/(student)/profile`)

**Displays:**
- Avatar (circular, editable)
- Name, role badge
- Stats row: Notes count | Quizzes taken | Streak days
- Progress charts (weekly study time)
- Settings section

**Actions:**

| Action | Control |
| :--- | :--- |
| Edit profile | Navigate to edit screen |
| Upload avatar | `expo-image-picker` → `POST /api/users/profile/photo/` |
| Dark mode toggle | Zustand theme store |
| Logout | Clear SecureStore + Zustand auth |

---

### 👨‍🏫 Instructor UI

#### 4.6 Dashboard (`/(instructor)/index`)

**Displays:**
- Total students enrolled across all courses
- Active students (last 7 days)
- Course performance summary cards
- AI insights panel (struggling topics, at-risk students)

**Widgets:** Metric cards, at-risk student feed, AI recommendation card

#### 4.7 Courses Screen (`/(instructor)/courses`)

**Displays:**
- My courses grid (thumbnail, title, status, enrollment count)
- Draft / Published filter chips

**Actions:**

| Action | API |
| :--- | :--- |
| Create course | `POST /api/instructor/courses/` |
| Edit course | `PATCH /api/instructor/courses/{id}/` |
| Upload materials | `POST /api/instructor/courses/{id}/materials/` |
| View course detail | Navigate to `[id]` screen |

#### 4.8 Students Screen (`/(instructor)/students`)

**Displays:**
- Student list with avatar, name, course enrollment
- Search bar
- Performance analytics per student (avg score, completion %)

**Actions:** Tap student → detail view, message student, view quiz history

#### 4.9 Messages Screen (`/(instructor)/messages`)

**Displays:**
- Student direct messages
- Group chats (course groups, instructor groups)
- Announcements feed

#### 4.10 Profile Screen (`/(instructor)/profile`)

**Displays:**
- Avatar + banner image
- Instructor bio and credentials
- Personal analytics (courses created, students taught)
- Settings and dark mode toggle

---

### 👑 Admin UI

#### 4.11 Dashboard (`/(admin)/index`)

**Displays:**
- Total users (students + instructors + admins)
- Active users today (DAU)
- AI usage meter (Gemini calls / quota)
- Platform health indicators (API latency, DB status)

#### 4.12 Users Screen (`/(admin)/users`)

**Manages:** Students, Instructors, Admins

**Actions:**

| Action | API | Confirmation Required |
| :--- | :--- | :--- |
| Ban user | `PATCH /api/admin/users/{id}/` `{ is_banned: true }` | Yes — reason input |
| Delete user | `DELETE /api/admin/users/{id}/` | Yes — type username |
| Promote role | `PATCH /api/admin/users/{id}/` `{ role: "instructor" }` | Yes — role picker |
| Demote role | `PATCH /api/admin/users/{id}/` `{ role: "student" }` | Yes — role picker |

#### 4.13 Analytics Screen (`/(admin)/analytics`)

**Displays:**
- User growth line chart (daily/weekly/monthly)
- Retention cohort graph
- Storage usage breakdown
- Popular features bar chart (most-used Hub mini-apps)

#### 4.14 Reports Screen (`/(admin)/reports`)

**Displays:**
- Abuse reports queue
- Content moderation flags
- Spam detection alerts

**Actions:** Review, dismiss, escalate, ban offending user

#### 4.15 Profile Screen (`/(admin)/profile`)

**Displays:** Admin avatar, name, last login, session controls, settings, dark mode, logout

---

## 💬 5. Real-Time Messaging System

A production-grade real-time messaging system supporting **Friends**, **Groups**, and **Conversations** with live delivery via WebSockets.

### 5.1 System Capabilities

| Feature | Description |
| :--- | :--- |
| Friend requests | Send, accept, decline, remove |
| Direct messages | 1:1 private conversations |
| Group chats | Study groups, course groups, instructor groups |
| Real-time delivery | WebSocket push to all room participants |
| Typing indicators | Broadcast typing state per conversation |
| Online status | Presence tracking via WebSocket heartbeat |
| Push notifications | `expo-notifications` for background delivery |
| Read receipts | Seen status tracked per message |

### 5.2 Technical Stack

```
┌─────────────────────┐     WebSocket      ┌──────────────────────┐
│  React Native App   │ ◄──────────────► │  Django Channels     │
│  (Zustand chat store)│                   │  (ASGI consumer)     │
└─────────────────────┘                   └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  Redis Channel Layer │
                                          └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  MongoDB Collections │
                                          │  friends, groups,    │
                                          │  conversations,      │
                                          │  messages            │
                                          └──────────────────────┘
```

| Layer | Technology |
| :--- | :--- |
| Transport | WebSockets via Django Channels |
| Channel Layer | Redis (pub/sub for room broadcasts) |
| Persistence | MongoDB document collections |
| Auth | JWT token passed as WebSocket query param |
| Frontend State | Zustand `chatStore` + React Query cache invalidation |

### 5.3 Friends System

**User Actions:**
- Search users by name or email
- Send friend request
- Accept / decline incoming requests
- Remove existing friend

**Friend Request Flow:**

```
User A sends request  →  status: "pending"
User B accepts        →  status: "accepted"  →  private conversation auto-created
User B declines       →  record deleted
```

### 5.4 Groups System

**Group Types:**

| Type | Created By | Members |
| :--- | :--- | :--- |
| Study group | Any student | Invited friends |
| Course group | Instructor (auto) | Enrolled students |
| Private group | Any user | Invited members |

**Group Permissions:**

| Role | Capabilities |
| :--- | :--- |
| `owner` | Delete group, promote admins, remove members |
| `admin` | Add/remove members, pin messages |
| `member` | Send messages, leave group |

**Example Document:**

```json
{
  "group_name": "AI Study Group",
  "type": "study_group",
  "members": ["user_id_1", "user_id_2", "user_id_3"],
  "admins": ["user_id_1"],
  "created_by": "user_id_1",
  "created_at": "2026-06-25T10:00:00Z"
}
```

### 5.5 Conversations

**Private Conversation:**

```json
{
  "conversation_id": "conv_123",
  "type": "private",
  "participants": ["user_id_1", "user_id_2"],
  "last_message": {
    "sender_id": "user_id_1",
    "content": "Hello",
    "created_at": "2026-06-25T10:05:00Z"
  },
  "unread_counts": { "user_id_1": 0, "user_id_2": 1 }
}
```

**Group Conversation:**

```json
{
  "conversation_id": "conv_456",
  "type": "group",
  "group_name": "Physics Team",
  "group_id": "group_789",
  "participants": ["user_id_1", "user_id_2", "user_id_3"]
}
```

### 5.6 Message Structure

```json
{
  "sender_id": "user_id_123",
  "message": "Hello",
  "message_type": "text",
  "file_url": null,
  "read_by": ["user_id_456"],
  "created_at": "2026-06-25T10:05:00Z"
}
```

**Supported `message_type` values:** `text` | `image` | `file` | `voice`

### 5.7 Messaging UI Specifications

#### Chat List Screen

| Element | Source |
| :--- | :--- |
| Profile image | `participants[].profile_photo_url` |
| Display name | Friend name or group name |
| Last message preview | `conversation.last_message.content` |
| Timestamp | `conversation.last_message.created_at` |
| Unread badge | `conversation.unread_counts[current_user_id]` |

#### Conversation Screen

| Feature | Implementation |
| :--- | :--- |
| Real-time messages | WebSocket subscription to `ws/chat/{conversation_id}/` |
| Send text | WebSocket send + MongoDB persist |
| Send images/files | Upload to Cloudinary → send URL in message |
| Voice messages | Record via `expo-av` → upload → send URL |
| Typing indicator | WebSocket event `typing.start` / `typing.stop` |
| Seen status | `read_by` array updated on message view |

### 5.8 MongoDB Collection Schemas

#### `friends`

```json
{
  "_id": "ObjectId",
  "user_id": "user_id_1",
  "friend_id": "user_id_2",
  "status": "pending | accepted | blocked",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

#### `groups`

```json
{
  "_id": "ObjectId",
  "name": "Physics Team",
  "type": "study_group | course_group | private_group",
  "members": ["user_id_1", "user_id_2"],
  "admins": ["user_id_1"],
  "created_by": "user_id_1",
  "course_id": "ObjectId (optional)",
  "created_at": "ISODate"
}
```

#### `conversations`

```json
{
  "_id": "ObjectId",
  "type": "private | group",
  "participants": ["user_id_1", "user_id_2"],
  "group_id": "ObjectId (optional)",
  "last_message": {
    "sender_id": "string",
    "content": "string",
    "created_at": "ISODate"
  },
  "unread_counts": { "user_id_1": 0, "user_id_2": 2 },
  "created_at": "ISODate"
}
```

#### `messages`

```json
{
  "_id": "ObjectId",
  "conversation_id": "ObjectId",
  "sender_id": "user_id_1",
  "content": "Hello",
  "type": "text | image | file | voice",
  "file_url": "string (optional)",
  "read_by": ["user_id_2"],
  "created_at": "ISODate"
}
```

### 5.9 Backend Messaging Endpoints

```
# Friends
GET    /api/messages/friends/              List friends
POST   /api/messages/friends/request/      Send friend request
PATCH  /api/messages/friends/{id}/accept/   Accept request
DELETE /api/messages/friends/{id}/         Remove friend

# Groups
GET    /api/messages/groups/               List my groups
POST   /api/messages/groups/               Create group
PATCH  /api/messages/groups/{id}/          Update group
POST   /api/messages/groups/{id}/members/  Add member

# Conversations
GET    /api/messages/conversations/        List conversations
GET    /api/messages/conversations/{id}/   Get conversation + messages
POST   /api/messages/conversations/        Create conversation

# WebSocket
WS     /ws/chat/{conversation_id}/?token={jwt}
```

---

## 🤖 6. Dynamic Data Architecture (Strict Mandate)

**Everything must come from the database. NO hardcoded data in production.**

This is a non-negotiable architectural requirement. Any screen rendering static arrays, mock objects, or placeholder content is a defect.

### 6.1 Dynamic Data Domains

All of the following MUST be fetched from MongoDB at runtime:

| Domain | Collection / Endpoint |
| :--- | :--- |
| Users & profiles | `users` → `/api/users/profile/` |
| Notes | `notes` → `/api/notes/` |
| Courses | `courses` → `/api/instructor/courses/` |
| Chats & messages | `conversations`, `messages` → `/api/messages/` |
| Analytics | `study_sessions` → `/api/analytics/` |
| AI outputs | Generated on-demand, cached in MongoDB |
| Notifications | `notifications` → `/api/notifications/` |
| Friends & groups | `friends`, `groups` → `/api/messages/friends/` |
| Quizzes & flashcards | `quizzes`, `flashcard_decks` → `/api/quiz/`, `/api/flashcards/` |
| Planner tasks | `study_plans` → `/api/planner/` |

### 6.2 Frontend Data Layer

| Concern | Tool | Responsibility |
| :--- | :--- | :--- |
| Server state | **React Query** (`@tanstack/react-query`) | Fetch, cache, refetch, paginate all API data |
| Client state | **Zustand** | Auth tokens, user session, theme, UI flags |
| Offline cache | **AsyncStorage** | Last 20 notes, flashcard decks, planner tasks |

### 6.3 Implementation Pattern

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

// ✅ CORRECT — dynamic fetch from MongoDB via API
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/analytics/summary/");
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

// ❌ FORBIDDEN — hardcoded mock data
// const MOCK_NOTES = [{ id: "1", title: "Calculus" }];
```

### 6.4 Zustand Store Responsibilities

| Store | Persists | Does NOT Persist |
| :--- | :--- | :--- |
| `authStore` | JWT tokens (SecureStore), user role | Notes, courses, messages |
| `themeStore` | Dark mode preference (AsyncStorage) | Analytics data |
| `chatStore` | Active conversation ID, typing state | Message history (use React Query) |
| `uiStore` | Hub overlay open/closed | Any business data |

### 6.5 Empty & Loading States

Every screen must handle three states dynamically:

1. **Loading** — skeleton placeholders while React Query fetches
2. **Empty** — illustration + CTA when MongoDB returns zero records
3. **Error** — retry button when API call fails

Never fall back to hardcoded demo content on empty or error states.

---

## 🧠 7. AI Architecture (Production-Ready)

AI is central to Wamdh. It is not a bolt-on feature — it is woven into every role's workflow through a unified RAG pipeline.

### 7.1 AI Providers

| Provider | Role | Model |
| :--- | :--- | :--- |
| **Primary** | Google Gemini API | `gemini-1.5-flash` (free tier) |
| **Fallback** | HuggingFace Inference API | Task-specific models |
| **Embeddings** | sentence-transformers (local) | `all-MiniLM-L6-v2` (384 dims) |
| **Vector Search** | MongoDB Atlas | KNN cosine similarity index |

### 7.2 AI Features by Role

#### 👨‍🎓 Student AI Tools

| Tool | Hub / Tab | Endpoint |
| :--- | :--- | :--- |
| Note summaries | Notes → AI menu | `POST /api/ai/summarize/` |
| Quiz generation | Hub → Quiz Center | `POST /api/ai/quiz/` |
| Flashcard generation | Hub → Flashcards | `POST /api/ai/flashcards/` |
| AI Tutor chat | Tab → AI Tutor | `POST /api/ai/chat/` |
| Study planner | Hub → Study Planner | `POST /api/planner/generate/` |
| Semantic search | Hub → AI Search | `POST /api/ai/search/` |

#### 👨‍🏫 Instructor AI Tools

| Tool | Hub Location | Endpoint |
| :--- | :--- | :--- |
| AI Quiz Builder | Hub → Quiz Builder | `POST /api/ai/quiz/` |
| AI Lesson Generator | Hub → AI Lesson Generator | `POST /api/ai/lesson/` |
| AI Assignment Builder | Hub → Assignments | `POST /api/ai/assignment/` |
| AI Performance Insights | Dashboard widget | `GET /api/instructor/ai-insights/` |

#### 👑 Admin AI Tools

| Tool | Hub Location | Endpoint |
| :--- | :--- | :--- |
| AI Usage Analytics | Hub → AI Usage Monitor | `GET /api/admin/ai-usage/` |
| AI Anomaly Detection | Dashboard alert feed | `GET /api/admin/ai-anomalies/` |
| AI System Optimization | Hub → System Settings | `POST /api/admin/ai-optimize/` |

### 7.3 AI Quality Requirements

Every AI response in production MUST meet these standards:

| Requirement | Implementation |
| :--- | :--- |
| **Fast** | Gemini Flash model; response streaming where supported |
| **Context-aware** | RAG retrieval injects relevant note/course chunks |
| **Accurate** | Top-3 vector search results with similarity threshold ≥ 0.7 |
| **Personalized** | User's notes, subjects, and history included in prompt |
| **Memory-aware** | `conversation_history` array passed on every chat request |

### 7.4 RAG Pipeline (Complete Flow)

```
User Query  →  Context Fetch  →  Vector Search  →  AI Generation  →  Response
```

**Step-by-step:**

```
┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  1. User     │    │  2. Context      │    │  3. Vector Search   │
│     Query    │───►│     Fetch        │───►│     (MongoDB Atlas) │
│              │    │  (note_id, role, │    │  KNN top-3 chunks   │
│  "Explain    │    │   history)       │    │  cosine ≥ 0.7       │
│   backprop"  │    └──────────────────┘    └──────────┬──────────┘
└──────────────┘                                        │
                                                        ▼
┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  6. Response │    │  5. AI           │    │  4. Prompt Build    │
│     Delivery │◄───│     Generation   │◄───│                     │
│  (JSON + WS) │    │  Gemini → HF     │    │  chunks + query +   │
│              │    │  fallback        │    │  system instructions│
└──────────────┘    └──────────────────┘    └─────────────────────┘
```

1. **User Query** — Student asks: *"What are neural activation functions?"*
2. **Context Fetch** — Backend loads user's note chunks, conversation history, and role-specific system prompt
3. **Vector Search** — Query embedded via `sentence-transformers`; KNN search on MongoDB Atlas vector index returns top 3 chunks (cosine similarity ≥ 0.7)
4. **Prompt Build** — System prompt + retrieved chunks + user question + conversation history assembled
5. **AI Generation** — Sent to Gemini 1.5 Flash; on rate limit → HuggingFace fallback
6. **Response Delivery** — JSON returned to client; chat message persisted to MongoDB; WebSocket broadcast if in active conversation

### 7.5 RAG Backend Implementation Reference

```python
# apps/rag/pipeline.py
def rag_query(user_id: str, query: str, note_id: str = None) -> str:
    # Step 1: Embed query
    query_vector = embedder.encode(query).tolist()

    # Step 2: Vector search (scoped to user's notes)
    filter_query = {"user_id": user_id}
    if note_id:
        filter_query["note_id"] = note_id

    chunks = vector_search(
        index="embeddings_index",
        query_vector=query_vector,
        filter=filter_query,
        limit=3,
        min_score=0.7,
    )

    # Step 3: Build prompt
    context = "\n\n".join(c["chunk_text"] for c in chunks)
    prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"

    # Step 4: Generate (Gemini primary, HF fallback)
    try:
        return call_gemini(prompt)
    except RateLimitError:
        return call_huggingface(prompt)
```

---

## 🔥 8. Final Product Vision

Wamdh is not just a study app. It is a **complete production-grade EdTech ecosystem**:

| Pillar | Role | Mission |
| :--- | :--- | :--- |
| **AI Learning Platform** | 👨‍🎓 Student | Learn interactively with RAG-powered notes, AI tutor, quizzes, flashcards, and gamified streaks |
| **Social Learning Network** | 👨‍🎓 Student | Connect with friends, join study groups, and collaborate in real-time |
| **Instructor Teaching System** | 👨‍🏫 Instructor | Create courses, assign work, generate AI content, and track student progress |
| **Admin Management System** | 👑 Admin | Manage users, monitor platform health, moderate content, and configure the system |
| **AI Assistant Layer** | 🤖 AI | Powers summaries, quizzes, lessons, insights, and contextual answers for everyone |

```
┌─────────────────────────────────────────────────────────────┐
│                    WAMDH ECOSYSTEM                          │
│                                                             │
│   👨‍🎓 Student ──► Learn    👨‍🏫 Instructor ──► Teach       │
│   👑 Admin ────► Manage   🤖 AI ──────────► Assist All     │
│                                                             │
│   5 Tabs  +  Wamdh Hub  +  Real-Time Messages  +  RAG AI  │
│   MongoDB  +  React Query  +  Zustand  +  Django Channels   │
└─────────────────────────────────────────────────────────────┘
```

---

*This SKILL.md is the single source of truth for the Wamdh EdTech platform. All implementations — frontend screens, backend endpoints, MongoDB schemas, WebSocket consumers, and AI pipelines — must reference this document first.*
