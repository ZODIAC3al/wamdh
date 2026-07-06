# Wamdh Platform Documentation

**AI-Powered Learning Platform** - An Arabic-branded educational platform (wamdh = "flash/spark" in Arabic) with a Django REST Framework backend, React Native/Expo mobile app, and Next.js marketing site.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [API Endpoints](#api-endpoints)
4. [Mobile App Structure](#mobile-app-structure)
5. [Features by Role](#features-by-role)
6. [Data Models (MongoDB Collections)](#data-models-mongodb-collections)
7. [Technology Stack](#technology-stack)
8. [Known Gaps](#known-gaps)
9. [UI Documentation](#ui-documentation)
   - [Color System](#color-system)
   - [Layout Structure](#layout-structure)
   - [Navigation Patterns](#navigation-patterns)
   - [Internationalization](#internationalization-i18n)
   - [Component Patterns](#component-patterns)
   - [Fonts](#fonts)
   - [State Management](#state-management)

---

## Architecture Overview

### Three-Tier Architecture

| Tier | Technology | Description |
|------|------------|-------------|
| **Mobile App** | React Native + Expo SDK 51+ | Primary product surface using expo-router for file-based routing |
| **Marketing Site** | Next.js App Router + Tailwind CSS | Landing page, features, pricing, download links |
| **Backend** | Django + Django REST Framework | JSON APIs with SimpleJWT authentication |

### Database Strategy

- **Primary**: MongoDB - Source of truth for user accounts, roles, profiles, notes, flashcards, quizzes, study plans, analytics
- **Secondary**: SQLite - Transient cache/replica for Django auth systems (token storage, migrations only)

### Mobile App Structure

```
mobile/src/
├── app/
│   ├── _layout.tsx              # Root controller - session validation
│   ├── (auth)/                  # Onboarding, login, registration
│   ├── (student)/               # Main learning space
│   │   ├── index.tsx            # Dashboard
│   │   ├── notes/               # Notes hub, upload, viewer
│   │   ├── flashcards/          # Deck management, review
│   │   ├── quiz/                # Quiz generation & taking
│   │   ├── planner/             # Study schedule, kanban
│   │   ├── ai/                  # AI chat tutor (Mona)
│   │   ├── community/           # Study groups, discussions
│   │   ├── messages/            # DMs, group chat
│   │   ├── analytics/           # Progress tracking, heatmaps
│   │   ├── whiteboard/          # Canvas for sketches
│   │   ├── premium/             # Stripe subscriptions
│   │   └── achievements/        # XP, badges, leaderboard
│   ├── (instructor)/            # Classroom metrics, grading
│   └── (admin)/                 # Moderation, user management
├── context/
│   └── WamdhContext.tsx         # Unified theme/colors/locale/user context
├── store/
│   ├── authStore.ts             # Zustand auth state (JWT tokens)
│   ├── themeStore.ts              # Theme preferences
│   └── uiStore.ts               # UI state management
└── lib/
    ├── api.ts                   # Axios client with auto JWT interceptors
    └── queryClient.ts           # React Query client
```

---

## User Roles & Permissions

### Student Role (`"student"`)

Default role for all new users. Access to personal learning features.

### Instructor Role (`"instructor"`)

Can create classes, publish assignments, grade submissions, view cohort analytics.

### Admin Role (`"admin"`)

Full platform access: user management, moderation, system telemetry, revenue metrics.

---

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/login/` | POST | Login with username/password, returns `{access, refresh}` tokens |
| `/api/users/refresh/` | POST | Refresh expired access token with refresh token |
| `/api/users/profile/` | GET | Get current user profile data |
| `/api/users/register/` | POST | Register new user account |

### Notes API (`/api/notes/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notes/` | GET | List all user notes |
| `/api/notes/` | POST | Create/upload a note (multipart/form-data) |
| `/api/notes/{id}/` | GET | Get specific note details |
| `/api/notes/subjects/` | GET | Get list of all subjects for filtering |

**Note Object Structure:**
```typescript
{
  id: string;
  title: string;
  subject: string;
  tags: string[];
  raw_text: string;
  summary?: string;
  key_concepts?: string[];
  word_count: number;
  created_at: string;
  embeddings?: number[]; // For RAG search
}
```

### AI Engine API (`/api/ai/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/summarize/` | POST | Generate summary from note |
| `/api/ai/key-points/` | POST | Extract key points from note |
| `/api/ai/quiz/` | POST | Generate MCQ quiz questions |
| `/api/ai/flashcards/` | POST | Generate flashcard pairs |
| `/api/ai/study-tip/` | GET | Get daily study tip |

**AI Request Example:**
```json
// POST /api/ai/summarize/
{ "note_id": "123", "mode": "medium" }

// POST /api/ai/quiz/
{ "note_id": "123", "count": 5, "difficulty": "medium", "type": "mcq" }
```

### Flashcards API (`/api/flashcards/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/flashcards/` | GET | List all decks |
| `/api/flashcards/` | POST | Create new deck |
| `/api/flashcards/{id}/review/` | GET | Get cards due for review (SM-2 algorithm) |
| `/api/flashcards/cards/` | POST | Add card to deck |

**Deck Object:**
```typescript
{
  id: string;
  title: string;
  subject: string;
  cards_count: number;
  created_at: string;
}
```

### Quiz API (`/api/quiz/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quiz/` | GET | List all quizzes |
| `/api/quiz/` | POST | Create quiz with questions |
| `/api/quiz/{id}/` | GET | Get quiz details |
| `/api/quiz/{id}/attempts/` | GET | Get attempt history |
| `/api/quiz/{id}/submit/` | POST | Submit quiz answers |
| `/api/quiz/stats/` | GET | Global quiz statistics |

**Quiz Object:**
```typescript
{
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  questions: Question[];
  time_limit_minutes: number;
  created_at: string;
}
```

### Study Planner API (`/api/planner/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/planner/` | GET | Get study plan |
| `/api/planner/today/` | GET | Get today's tasks |
| `/api/planner/generate/` | POST | Generate AI study schedule |
| `/api/planner/task/` | POST | Create custom task |
| `/api/planner/task/{id}/` | PATCH | Toggle task completion |
| `/api/planner/task/{id}/delete/` | DELETE | Delete task |

### Community API (`/api/messages/communities/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/messages/communities/` | GET | List all communities |
| `/api/messages/communities/` | POST | Create new community |
| `/api/messages/communities/{id}/` | GET | Get community details |
| `/api/messages/communities/{id}/join/` | POST | Join a community |
| `/api/messages/communities/{id}/posts/` | GET/POST | Get/create community posts |
| `/api/messages/communities/{id}/resources/` | GET/POST | Get/shared resources |

### Messages API (`/api/messages/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/messages/rooms/` | GET | List all conversation rooms |
| `/api/messages/dm/start/` | POST | Start a direct message |
| `/api/messages/rooms/{id}/` | GET/POST | Get room messages / send message |
| `/api/messages/users/` | GET | Search users for DMs |

### Analytics API (`/api/analytics/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/summary/` | GET | Weekly study summary |
| `/api/analytics/weekly/` | GET | Weekly study time data |
| `/api/analytics/weak-topics/` | GET | Topics with low accuracy |
| `/api/analytics/subjects/` | GET | Subject-wise study breakdown |
| `/api/analytics/recommendations/` | GET | AI study recommendations |
| `/api/analytics/predict/` | GET | Predictive analytics (exam score, burnout) |
| `/api/analytics/community-missions/` | GET | Community challenge missions |

### Payments API (`/api/payments/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/status/` | GET | Check premium subscription status |
| `/api/payments/create-intent/` | POST | Create Stripe payment intent |
| `/api/payments/confirm/` | POST | Confirm payment completion |
| `/api/payments/store/catalog/` | GET | Get marketplace store catalog |

### Instructor API (`/api/instructor/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/instructor/analytics/overview/` | GET | Class overview stats |
| `/api/instructor/submissions/` | GET | Pending assignment submissions |
| `/api/instructor/submissions/{id}/grade/` | POST | Grade student submission |

### Admin API (`/api/admin/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/admin/metrics/` | GET | Platform-wide statistics |
| `/api/admin/health/` | GET | System health check |
| `/api/admin/instructors/` | GET | Instructor leaderboard |
| `/api/admin/blueprint-schedule/` | POST | Schedule classroom slots |

---

## Mobile App Screens

### Student Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | Welcome/Landing | Entry point |
| `/(student)` | Dashboard | XP, streak, today's tasks, recommendations |
| `/(student)/notes` | Notes Library | Browse all notes |
| `/(student)/notes/upload` | Upload | PDF/image/text note ingestion |
| `/(student)/notes/[id]` | Note Viewer | View note, AI actions (summarize, flashcards, quiz) |
| `/(student)/quiz` | Quiz List | All generated quizzes |
| `/(student)/quiz/[id]` | Quiz Taking | Take quiz, see results |
| `/(student)/flashcards` | Deck List | All flashcard decks |
| `/(student)/flashcards/[id]` | Review | SM-2 spaced repetition review |
| `/(student)/planner` | Study Planner | Weekly schedule, daily tasks |
| `/(student)/planner/timer` | Focus Timer | Pomodoro timer |
| `/(student)/planner/kanban` | Kanban Board | Todo/Progress/Done workflow |
| `/(student)/community` | Groups | Public & private study communities |
| `/(student)/community/[id]` | Community Detail | Feed, files, chat, rankings |
| `/(student)/messages` | Messages | DM list |
| `/(student)/messages/[id]` | Chat | Conversation view |
| `/(student)/analytics` | Analytics | Study time, weak topics, subject focus |
| `/(student)/leaderboard` | Leaderboard | XP rankings |
| `/(student)/premium` | Premium | Subscription plans, store access |
| `/(student)/premium/store` | Marketplace | Themes, power-ups |
| `/(student)/profile` | Profile | User profile, settings |
| `/(student)/profile/theme` | Theme | Color customization |
| `/(student)/whiteboard` | Whiteboard | SVG canvas for sketches |
| `/(student)/mindmap` | Mind Map | Visual concept mapping |
| `/(student)/achievements` | Achievements | Badge collection |

### Instructor Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `/(instructor)` | Dashboard | Students, cohorts, submissions |
| `/(instructor)/profile` | Profile | Instructor profile |
| `/(instructor)/profile/edit` | Edit Profile | Update profile |
| `/(instructor)/messages` | Messages | Student messages |
| `/(instructor)/quiz/build` | Quiz Builder | Create class quizzes |
| `/(instructor)/students` | Students | Student rosters |
| `/(instructor)/announcements` | Announcements | Post announcements |

### Admin Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `/(admin)` | Dashboard | System metrics, revenue |
| `/(admin)/analytics` | System Analytics | Infrastructure health |
| `/(admin)/users` | User Management | View/edit users |
| `/(admin)/reports` | Moderation | Reported content |
| `/(admin)/reports/[id]` | Report Detail | Review specific reports |
| `/(admin)/system/monitor` | Monitor | Live logs, task queues |
| `/(admin)/settings` | Settings | Stripe, feature flags |

---

## Features by Role

### Student Features

#### Notes Hub
- Upload PDF files or scan physical notes via camera OCR
- View AI-generated structured study guides and key-concept summaries
- **API**: `/api/notes/`, `/api/ai/summarize/`, `/api/ai/key-points/`

#### AI Chat Tutor ("Mona")
- Conversational tutor grounded in uploaded notes via RAG retrieval
- ELI5 (Explain Like I'm 5) simplification mode
- **API**: `/api/ai/chat/` (TODO - chat endpoint)

#### Flashcards
- Review spaced-repetition decks using SM-2 algorithm
- Review intervals computed based on self-reported recall difficulty
- **API**: `/api/flashcards/`, `/api/flashcards/{id}/review/`

#### Quiz Generator
- Generate multiple-choice quizzes from study materials
- Submit attempts and receive explanations
- **API**: `/api/quiz/`, `/api/quiz/{id}/submit/`

#### Planner & Kanban
- AI-generated personalized study schedule
- Three-column Kanban (Todo/Progress/Done)
- Pomodoro timer integration
- **API**: `/api/planner/`, `/api/planner/task/`

#### Analytics Dashboard
- Study-time distribution per subject
- 30-day heatmap activity tracking
- Weak-area detection
- GPA calculator
- **API**: `/api/analytics/summary/`, `/api/analytics/weekly/`

#### Gamification
- XP: 10 points per percentage point on quizzes, 10 XP per study minute
- Achievement badges
- Global leaderboard ranking

#### Whiteboard
- Touch-based SVG canvas for sketching equations/diagrams

#### Premium Upgrades
- Stripe-based subscription
- Unlock: unlimited uploads, advanced AI features, offline modes

### Instructor Features

#### Classrooms
- Create and manage classes
- Invite students

#### Assignments
- Publish assignments
- Grade student submissions with feedback
- **API**: `/api/instructor/submissions/`, `/api/instructor/submissions/{id}/grade/`

#### Quiz Board
- Publish curriculum-aligned tests
- View aggregate pass rates

#### Cohort Analytics
- Monitor class engagement
- Identify struggling students
- **API**: `/api/instructor/analytics/overview/`

#### Direct Messages
- Chat one-on-one with students
- Group Q&A sessions

### Admin Features

#### Moderation Center
- Review reported messages
- Flag inappropriate interactions
- **API**: `/api/admin/reports/`

#### User Management
- Modify user roles
- Grant XP/levels
- Ban users
- **API**: `/api/admin/users/`

#### Platform Metrics
- User growth trends
- Database size
- Stripe billing insights
- **API**: `/api/users/admin/metrics/`

#### System Telemetry
- Adjust feature switches
- Monitor background task queues
- Live server log streams

---

## Data Models (MongoDB Collections)

### Users Collection
```javascript
{
  _id: ObjectId,
  username: string,
  email: string,
  password_hash: string,
  role: "student" | "instructor" | "admin",
  xp_points: number,
  streak_days: number,
  profile_photo_url: string,
  banner_image_url: string,
  bio: string,
  is_premium: boolean,
  premium_until: Date,
  created_at: Date
}
```

### Notes Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  title: string,
  subject: string,
  tags: string[],
  raw_text: string,
  summary: string,
  key_concepts: string[],
  chunk_index: number, // For 500-word chunks with 50-word overlap
  embeddings: number[], // SentenceTransformer vectors
  created_at: Date
}
```

### Flashcards Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  title: string,
  subject: string,
  cards: [{
    front: string,
    back: string,
    ease_factor: number,
    repetitions: number,
    next_review: Date
  }],
  created_at: Date
}
```

### Quizzes Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  title: string,
  difficulty: string,
  questions: [{
    question: string,
    options: string[],
    correct_answer: number
  }],
  attempts: [{
    user_id: ObjectId,
    answers: number[],
    score: number,
    completed_at: Date
  }],
  time_limit_minutes: number,
  created_at: Date
}
```

### Communities Collection
```javascript
{
  _id: ObjectId,
  name: string,
  description: string,
  is_public: boolean,
  owner_id: ObjectId,
  admins: ObjectId[],
  members: ObjectId[],
  tags: string[],
  pending_requests: ObjectId[],
  created_at: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  room_id: ObjectId,
  sender_id: ObjectId,
  text: string,
  created_at: Date
}
```

### Planner Tasks Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  subject: string,
  topic: string,
  duration_mins: number,
  date: string,
  completed: boolean,
  created_at: Date
}
```

---

## Technology Stack

### Mobile (React Native + Expo)
- Expo SDK 51+
- expo-router (file-based routing)
- React Query (data fetching & caching)
- Zustand (state management)
- NativeWind (Tailwind for RN)
- Expo SecureStore (token persistence)
- Stripe React Native SDK

### Backend (Django)
- Django 4.x
- Django REST Framework
- SimpleJWT (authentication)
- PyMuPDF/fitz (PDF processing)
- pytesseract (OCR)
- SentenceTransformers (embeddings)
- Gemini 1.5 Flash (AI generation)

### Web (Next.js)
- Next.js App Router
- Tailwind CSS
- React 18

---

## Known Gaps

1. **No vector index** - RAG search uses local cosine similarity; will degrade with scale
2. **No OCR confidence handling** - Poor scans flow into embeddings without quality gate
3. **No duplicate-note detection** - Repeated uploads silently inflate storage
4. **No Stripe webhook handling** - Subscription lifecycle events may not be tracked
5. **No automated moderation pre-pass** - Moderation is entirely reactive
6. **No push notification delivery mechanism** - Reminders have no backend
7. **No i18n/RTL support** - Despite Arabic branding

---

## UI Documentation

### Color System

#### Theme Colors (`mobile/src/context/WamdhContext.tsx`)

**Light Theme (`LIGHT_COLORS`):**
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#FAFAFA` | Main background |
| `cardBg` | `#FFFFFF` | Card/surface backgrounds |
| `border` | `#E5E5E5` | Border colors |
| `inputBg` | `#F5F5F5` | Input field backgrounds |
| `textPrimary` | `#171717` | Primary text |
| `textSecondary` | `#737373` | Secondary/muted text |
| `accent` | `#262626` | Brand accent (icons, buttons) |
| `accentLight` | `#404040` | Lighter accent variant |
| `accentMuted` | `rgba(38, 38, 38, 0.08)` | Accent backgrounds |
| `danger` | `#EF4444` | Error/danger states |
| `success` | `#10B981` | Success/completion |
| `warning` | `#F59E0B` | Warnings |
| `info` | `#3B82F6` | Information |

**Dark Theme (`DARK_COLORS`):**
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0A0A0A` | Main background |
| `cardBg` | `#171717` | Card/surface backgrounds |
| `border` | `#262626` | Border colors |
| `inputBg` | `#171717` | Input field backgrounds |
| `textPrimary` | `#F5F5F5` | Primary text |
| `textSecondary` | `#A3A3A3` | Secondary/muted text |
| `accent` | `#FAFAFA` | Brand accent |
| `statusBarStyle` | `light-content` | Dark theme status bar |

#### Premium Theme Colors (Locked behind purchases)
| Color | Theme Name | Requirement |
|-------|------------|-------------|
| `#FF007F` | Cyber Neon | `theme_cyber_neon` ownership |
| `#FF6B35` | Sora Light | `theme_sora_light` ownership |
| `#000000` | Dark Material | `theme_dark_material` ownership |

#### Feature Icon Colors
| Feature | Color | Usage |
|---------|-------|-------|
| Quiz/Focus | `#BE1A1A` | Primary accent (red) |
| Success/GPA | `#10B981` | Success (green) |
| Study Tip | `#F7D87F` | Warning/highlights (amber) |
| Flashcards | `#3B82F6` | Info (blue) |
| Mindmap | `#8B5CF6` | Purple |
| Whiteboard | `#EC4899` | Pink |
| Premium | `#F59E0B` | Gold |

### Layout Structure

#### Tab Navigation (Student)

```
mobile/src/app/(student)/_layout.tsx
```

**Tab Bar Configuration:**
- **Height**: 64px
- **Padding**: 10px top/bottom
- **Style**: Floating with shadow on light mode, flat on dark mode
- **Active Color**: `#BE1A1A` (brand red)
- **Inactive Color**: Theme's `textSecondary`

**Tabs (Visible):**
| Tab | Icon (Inactive) | Icon (Active) | Route |
|-----|-----------------|---------------|-------|
| Home | `home-outline` | `home` | `/(student)` |
| Notes | `document-text-outline` | `document-text` | `/(student)/notes` |
| AI Tutor | `sparkles-outline` | `sparkles` | `/(student)/ai/chat` (centered FAB) |
| Messages | `chatbubbles-outline` | `chatbubles` | `/(student)/messages/index` |
| Profile | `person-outline` | `person` | `/(student)/profile` |

**Instructor Tab Navigation:**
| Tab | Icon (Inactive) | Icon (Active) | Route |
|-----|-----------------|---------------|-------|
| Dashboard | `grid-outline` | `grid` | `/(instructor)` |
| Courses | `book-outline` | `book` | `/(instructor)/courses/index` |
| Students | `people-outline` | `people` | `/(instructor)/students/index` |
| Messages | `chatbubbles-outline` | `chatbubbles` | `/(instructor)/messages/index` |
| Profile | `person-outline` | `person` | `/(instructor)/profile/index` |

**Admin Tab Navigation:**
| Tab | Icon (Inactive) | Icon (Active) | Route |
|-----|-----------------|---------------|-------|
| Dashboard | `shield-checkmark-outline` | `shield-checkmark` | `/(admin)` |
| Users | `people-outline` | `people` | `/(admin)/users/index` |
| Analytics | `bar-chart-outline` | `bar-chart` | `/(admin)/analytics/index` |
| Reports | `flag-outline` | `flag` | `/(admin)/reports/index` |
| Profile | `person-outline` | `person` | `/(admin)/profile/index` |

**Hidden Screens (via Hub FAB):**
- `/(student)/quiz` - All quizzes
- `/(student)/analytics` - Analytics dashboard
- `/(student)/planner` - Study planner
- `/(student)/flashcards` - Flashcard decks
- `/(student)/premium` - Premium subscriptions
- `/(student)/achievements` - Achievements & XP
- `/(student)/leaderboard` - Leaderboard
- `/(student)/planner/timer` - Pomodoro timer
- `/(student)/planner/kanban` - Kanban board
- `/(student)/mindmap` - Knowledge graph
- `/(student)/whiteboard` - Canvas sketch
- `/(student)/sandbox` - Code playground

#### Wamdh Hub (Modal Drawer)

```
mobile/src/components/WamdhHub.tsx
```

**Hub Categories:**

**Student Hub:**
1. **Study Tools** - Quiz Center, Flashcards, Study Planner, Focus Timer, Downloads, AI Voice Tutor, AI Lecture Gen, Mock Exam Sim, Code Playground
2. **Analytics & AI** - Analytics, AI Search, XP & Shop, Mindmap, Whiteboard, Bilingual Glossary
3. **Social & Extras** - Study Community, Wamdh Store, Study Rooms, Leaderboard, GPA Calculator

**Instructor Hub:**
1. **Teaching Tools** - Quiz Builder, Assignments, Exam Creator, Announcements, Office Hours
2. **AI & Analytics** - Course Analytics, AI Lesson Gen, Classroom, Syllabus Gaps, Plagiarism Check

**Admin Hub:**
1. **Platform Management** - API Quota Control, Prompt Playground, Security & GDPR, System Telemetry
2. **Operations** - Stripe Dashboard, Moderation Queue, Vector Health, Referral Manager, Audit Logs

### Navigation Patterns

#### Stack Navigation
- Auth flows use Expo Router's automatic stack
- Each screen accessible via `router.push()` or `router.replace()`
- Back gestures handled automatically

#### Modal Navigation
- Hub opened via FAB button (`HubFab` component)
- Slides up from bottom (iOS pageSheet style)
- Community posts, members open as modals

#### Deep Linking Patterns
```typescript
// Note navigation
router.push({ pathname: "/(student)/notes/[id]", params: { id: noteId } });

// Quiz navigation
router.push({ pathname: "/(student)/quiz/[id]", params: { id: quizId } });

// Chat navigation
router.push({ pathname: "/(student)/messages/[id]", params: { id: roomId, name } });
```

### Internationalization (i18n)

**Supported Locales:**
- English (`en`) - Default
- Arabic (`ar`) - RTL support

**Translation Structure:** (`mobile/src/lib/locales/`)
```typescript
// en.json
{
  "welcome": "Welcome",
  "home": "Home",
  "notes": "Notes Hub",
  "ai_tutor": "AI Tutor",
  // ... 59 total keys
}

// ar.json (Arabic translations for all keys)
```

**RTL Handling:**
- Detected via `isRtl = locale === "ar"`
- Layout direction: `flexDirection: isRtl ? "row-reverse" : "row"`
- Text alignment: `textAlign: isRtl ? "right" : "left"`
- Chevron icons: `isRtl ? "chevron-back" : "chevron-forward"`

### Component Patterns

#### Common Styles

**Header Pattern:**
```typescript
header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingTop: 56,
  paddingBottom: 14,
  borderBottomWidth: 1,
}
```

**Card Pattern:**
```typescript
card: {
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
}
```

**Input Pattern:**
```typescript
input: {
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 12,
  borderWidth: 1,
  paddingHorizontal: 14,
  paddingVertical: 13,
}
```

**Button Types:**
- Primary CTA: `#BE1A1A` background, white text, 50px radius
- Secondary: border style, text color accent
- Icon Button: 38x38 circle, icon centered

### Fonts

**Loaded Fonts:**
- Inter (400, 500, 600, 700)
- Sora (700)
- JetBrainsMono (400) - for code display

### State Management

#### Auth Store (`useAuthStore`)
- Persists to SecureStore (device) or sessionStorage (web)
- Auto-injects JWT tokens via axios interceptors
- Handles token refresh on 401 errors

#### Theme Store (`useThemeStore`)
- Persists theme mode (light/dark/system)
- Custom premium accent colors (locked behind purchases)

#### UI Store (`useUiStore`)
- Controls Hub visibility
- Manages modal states

---

*Generated for offline download. Last updated: June 2026*