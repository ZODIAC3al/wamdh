---
name: wamdh
description: Use this skill whenever working on Wamdh, the AI-powered learning platform (Arabic for "flash"/"spark") with a Django REST Framework backend, React Native/Expo mobile app, and Next.js marketing site. Trigger this skill for any task touching the apps.notes, apps.ai_engine, apps.rag, apps.flashcards, apps.planner, apps.analytics, apps.messages, or apps.payments Django apps; any mobile screens under (auth), (student), (instructor), or (admin) route groups; the hybrid SQLite + MongoDB data layer; Gemini/SentenceTransformers AI integrations; or Stripe payment flows. Also use this skill when adding new features to Wamdh, debugging existing modules, planning architecture or roadmap decisions, scoping new functionality, or writing documentation/specs for the platform — it is the canonical reference for every feature that exists today and every feature proposed for the roadmap, with full descriptions of what each does and which part of the system it touches.
---

# Wamdh — Full Feature & Architecture Reference

Wamdh is a role-based AI study platform spanning three codebases: a Django REST Framework backend, a React Native (Expo) mobile app, and a Next.js marketing site. This skill is the single source of truth for **what the platform does today** and **what's proposed for the roadmap**, with enough detail on each feature that you can reason about scope, dependencies, and which existing module it touches without re-deriving it from scratch.

Structure of this document:
1. Architecture & data model (how everything is built)
2. Existing functionality, by role (what's live today, in detail)
3. Proposed functionality (roadmap features, in detail, grouped by role/area)
4. Known gaps in the existing system
5. Working principles for any task on this project

---

## 1. Architecture & Data Model

### Three tiers

- **Mobile app** (`/mobile`) — React Native with Expo SDK 51+, the primary product surface. Uses `expo-router` for file-based routing with role-gated route groups.
- **Marketing site** (`/web`) — Next.js, App Router, Tailwind CSS. Landing page, feature showcase, pricing, download links only — not a feature surface, don't add product functionality here.
- **Backend** (`/backend`) — Django + Django REST Framework, JSON APIs authenticated via SimpleJWT. One Django app per feature domain.

### Database strategy

MongoDB is the primary source of truth for the entire application (including user accounts, credentials, roles, profile details, streaks, and XP points, alongside notes, flashcards, quizzes, study plans, etc.). SQLite is used purely as an internal transient shadow cache/replica layer for Django's core authentication systems (like SimpleJWT tokens) and migrations, but all application-level queries (profiles, registration, analytics, dashboard, metrics, leaderboards, cohort listings) execute directly against MongoDB.

### Mobile app structure

- `src/app/_layout.tsx` — root controller, validates session and routing rules.
- `(auth)` — onboarding, login, registration screens.
- `(student)` — main learning space: dashboard, AI chat, planner, note OCR scan, sketchpad.
- `(instructor)` — classroom metrics, grading, assignments list.
- `(admin)` — telemetry graphs, moderation controls, user bans/status.
- State: Zustand stores (`authStore.ts`) persisting session to SecureStore.
- Network/cache: Axios wrapper (`api.ts`) + `@tanstack/react-query`.
- Styling: NativeWind (Tailwind for RN) + Google Fonts (Sora, Inter).

### Backend module map

| App | Responsibility | Key files |
|---|---|---|
| `apps.notes` | PDF (fitz/PyMuPDF) + image OCR (pytesseract) ingestion; 500-word chunks with 50-word overlap; triggers embedding | `processor.py`, `views.py` |
| `apps.ai_engine` | Gemini 1.5 Flash integration for study guides, MCQs, flashcards, study tips; has mock fallback when API unavailable | `gemini.py`, `views.py` |
| `apps.rag` | Encodes queries via SentenceTransformers `all-MiniLM-L6-v2`; local cosine similarity search over Mongo-stored vectors to ground the AI tutor | `search.py`, `views.py` |
| `apps.flashcards` | SuperMemo-2 (SM-2) spaced repetition: ease factor, repetition cycles, next-review date | `sm2.py` |
| `apps.planner` | AI-generated study calendars; three-column Kanban (Todo/Progress/Done) | `views.py` |
| `apps.analytics` | Study-time distributions, 30-day heatmap, weak-area detection, XP/levels, leaderboards, GPA calculator | `views.py` |
| `apps.messages` | DMs, message rooms, groups, friend requests | — |
| `apps.payments` | Premium package selection, Stripe PaymentIntent processing | `views.py` |

When scoping new work, identify which of these eight apps it extends first. A new Django app is the exception, not the default — only justified when a feature genuinely doesn't fit any existing responsibility (e.g., a dedicated trust-and-safety/moderation app).

---

## 2. Existing Functionality (Live Today)

### 2.1 Student role

- **Notes Hub** — Upload files or scan physical notes via camera OCR; view AI-generated structured study guides, definition lists, and key-concept summaries extracted from the source material.
- **AI Chat Tutor ("Mona")** — Conversational tutor that answers questions grounded in the student's own uploaded notes (via RAG retrieval), with an optional ELI5 (Explain Like I'm 5) simplification mode.
- **Flashcards** — Review spaced-repetition decks; review intervals are computed by the SM-2 algorithm based on self-reported recall difficulty.
- **Quiz Generator** — Generate multiple-choice quizzes from uploaded study materials; submit attempts and receive explanations for both correct and incorrect answers.
- **Planner & Kanban** — AI proposes a personalized study schedule targeting upcoming exams; students manage micro-tasks on a three-column Kanban board (Todo, Progress, Done).
- **Analytics dashboard**:
  - Study-time distribution per subject.
  - GitHub-style 30-day study activity heatmap.
  - GPA calculator from manually entered semester grades, for tracking academic goals.
- **Gamification** — XP earned at fixed rates (10 XP per percentage point scored on a quiz; 10 XP per minute of logged study time); unlockable achievement badges; global leaderboard ranking.
- **Whiteboard** — Touch-based SVG canvas for sketching equations or diagrams during study sessions.
- **Premium upgrades** — Stripe-based subscription unlocking unlimited document upload limits, more advanced AI features, and offline modes.

### 2.2 Instructor role

- **Classrooms** — Create classes and invite students to join.
- **Assignments** — Publish assignments, grade student submissions, leave feedback.
- **Quiz Board** — Publish curriculum-aligned tests and review aggregate student pass rates.
- **Cohort analytics** — Monitor overall class engagement, identify students falling behind, view cohort-level performance trends.
- **Direct Messages** — Chat one-on-one with students or run group Q&A sessions.

### 2.3 Admin role

- **Moderation Center** — Review reported messages, flag inappropriate interactions, clean up problematic group spaces.
- **User Management** — Modify user roles, grant promotional XP/levels, ban users.
- **Platform Metrics** — View user growth trends, database size, Stripe billing insights.
- **System Telemetry** — Adjust developer feature switches, review background task queues, monitor live server log streams.

---

## 3. Proposed Functionality (Roadmap)

Each entry below is a candidate feature with a description of what it does and which existing module it most naturally extends. None of these exist yet — treat the module column as "where this would live," not "where this is implemented."

### 3.1 Student-facing

| Feature | Description | Extends |
|---|---|---|
| Exam predictor | Estimates likely exam weight per chapter/topic by combining past quiz topic frequency, instructor-flagged emphasis, and note density per topic | `apps.analytics` + `apps.ai_engine` |
| Audio note capture | Records a lecture, transcribes via speech-to-text (e.g. Whisper), and feeds the transcript through the existing OCR/chunking/embedding pipeline | `apps.notes` |
| Mind-map auto-generation | Converts a note's extracted concepts into a visual node graph, reusing embedding clusters already computed during ingestion | `apps.notes` + `apps.rag` |
| Peer-tutoring marketplace | Lets students who score well on a topic offer (paid or free) tutoring slots to students struggling on that same topic, matched via analytics data | `apps.messages` + `apps.analytics` |
| Daily micro-quiz push | A push notification each day surfacing one bite-sized question pulled from spaced-repetition cards that are due, answerable inline | `apps.flashcards` (new notification layer) |
| Study group matching | Suggests study partners based on overlapping enrolled courses plus complementary strengths/weaknesses pulled from analytics | `apps.messages` + `apps.analytics` |
| Citation-grounded chat answers | Tutor responses link back to the exact note/page/chunk used to generate the answer, with a "view source" action | `apps.rag` + `apps.ai_engine` |
| Multi-note synthesis mode | Lets a student ask the tutor to compare/contrast across two or more of their own uploaded note sets (e.g. lecture notes vs. textbook chapter) | `apps.ai_engine` + `apps.rag` |
| Handwriting practice mode | Canvas-based equation/diagram input with AI grading and feedback, building on the existing whiteboard | `apps.notes` (whiteboard extension) |
| XP shop / cosmetic rewards | Spend earned XP on avatar customization, app themes, or "streak freeze" tokens that protect a streak from lapsing | `apps.analytics` (gamification layer) |
| Voice mode for AI Tutor | Speech-to-text question input and text-to-speech answer playback for hands-free or accessible studying | `apps.ai_engine` |
| Collaborative study rooms | Shared flashcard decks or live quiz competitions between friends, built on the existing `friends`/`groups` collections | `apps.messages` + `apps.flashcards` |
| Exam / focus mode | Temporarily silences notifications and DMs, locks the app to study-only screens, optionally runs a Pomodoro timer tied into XP/analytics | `apps.analytics` (mobile UX feature) |
| Smart note linking | Detects when two uploaded notes are semantically related via existing embeddings and surfaces "this connects to your other notes" suggestions | `apps.rag` |
| Export to Anki / PDF | Lets a student export flashcard decks or summarized notes out of the app in standard formats | `apps.flashcards` + `apps.notes` |
| Offline mode (concrete scope) | Defines precisely which premium "offline mode" features actually work without connectivity (cached flashcards/notes) vs. which require it (AI chat, generation) | `apps.payments` (premium tier definition) |

### 3.2 Instructor-facing

| Feature | Description | Extends |
|---|---|---|
| Bulk class material upload | Instructor seeds a class-wide knowledge base; students' RAG search can optionally include both personal notes and class-shared material | `apps.notes` + `apps.rag` |
| Auto-flagged struggling students | Surfaces a ranked list of at-risk students proactively, computed from the same heatmap/weak-area analytics already used for students | `apps.analytics` |
| Submission similarity/plagiarism check | Reuses existing sentence-transformer embeddings to score similarity between text-based assignment submissions | `apps.rag` (new comparison use) |
| Rubric-based AI-assisted grading | Instructor defines a rubric; AI pre-scores text submissions against it; instructor reviews and adjusts rather than grading from a blank slate | `apps.ai_engine` |
| Live in-class quiz/poll mode | Kahoot-style real-time synchronous quiz session; results stream into the existing `quiz_attempts` collection | `apps.flashcards`/quiz engine (real-time layer) |
| Auto-generated lesson plan from syllabus | Instructor uploads a syllabus PDF; AI proposes a week-by-week content and assignment schedule | `apps.ai_engine` + `apps.notes` |
| Class-level weak-topic heatmap | Aggregate (not per-student) view of which concepts the whole cohort is struggling with, to guide re-teaching priorities | `apps.analytics` |
| Office hours scheduler | Calendar-based booking system for instructor availability, integrated with existing messaging infrastructure | `apps.messages` |

### 3.3 Admin / platform

| Feature | Description | Extends |
|---|---|---|
| Referral / invite-a-friend | Tracks referrals and grants bonus XP or premium trial days, using the existing `friends` model as the underlying graph | `apps.analytics` + `apps.payments` |
| Severity-scored moderation queue | Auto-classifies reported messages by severity so admins triage worst-first instead of first-in-first-out | `apps.messages` (moderation layer) |
| AI cost usage alerting | Sends an alert when a user or the whole platform crosses a daily API-spend threshold for Gemini/HuggingFace calls | new telemetry layer on `apps.ai_engine` |
| Feature flag / experimentation framework | Formalizes the existing "developer switches" into a proper system for rolling out new prompts, XP formulas, or UI variants to a subset of users and measuring impact | System Telemetry (admin) |
| Data export & account deletion | Self-serve "export my data" and "delete my account" flows for compliance (GDPR-style) requirements | new compliance layer, cross-cutting |
| Automated content moderation pre-pass | Lightweight automated classifier (profanity/abuse detection) flags messages before admin review, reducing manual triage load | `apps.messages` |
| Cost monitoring dashboard | Admin-facing view of AI API spend broken down per user/day, alongside existing database-size metrics | `apps.ai_engine` + Platform Metrics (admin) |

### 3.4 Cross-cutting (no single role)

| Feature | Description | Extends |
|---|---|---|
| Push notification system | Delivery layer for streak reminders, "quiz results are in," instructor replies, and flashcards due today — currently has no implementation at all | new infra, touches `apps.flashcards`, `apps.messages`, `apps.analytics` |
| Localization (i18n) / RTL support | Arabic-language UI and right-to-left layout support for the mobile app — notably absent despite the project's Arabic name | mobile app-wide |
| Stripe webhook handling | Listens for `checkout.session.completed`, renewal, cancellation, and failed-payment events so subscription state stays accurate without relying solely on initial PaymentIntent creation | `apps.payments` |
| OCR confidence thresholding | Flags low-confidence OCR output for student review instead of silently embedding unreliable text | `apps.notes` |
| Duplicate/near-duplicate note detection | Detects re-uploaded or near-identical notes to avoid polluting the vector store and unfairly consuming document-limit quotas | `apps.notes` |
| Vector index migration | Replaces local cosine similarity with a proper vector index (MongoDB Atlas Vector Search, Qdrant, or pgvector) once search volume grows | `apps.rag` |
| Conversation memory strategy | Explicit policy for how much `ai_chat_history` gets fed back into the model per message (truncation, summarization, or full RAG-per-turn) to avoid context bloat | `apps.ai_engine` |
| Leech detection for flashcards | Identifies cards that repeatedly fail review (an Anki-style "leech") and intervenes rather than leaving the student stuck in an endless review loop | `apps.flashcards` |
| Performance-linked planner | Connects quiz/flashcard performance directly to the AI study plan, auto-inserting remediation tasks when a student does poorly on a topic instead of following a static pre-exam schedule | `apps.planner` + `apps.analytics` |

---

## 4. Known Gaps in the Existing System

These aren't proposed features so much as risks already present in what's live today. Account for them rather than building new functionality on top of them unknowingly:

- **No vector index** — RAG search is local cosine similarity over Mongo; will degrade as notes-per-user and users both grow.
- **No OCR confidence handling** — poor scans flow straight into embeddings with no quality gate.
- **No duplicate-note detection** — repeated uploads silently inflate storage and document-limit counts.
- **No Stripe webhook handling mentioned** — subscription lifecycle events beyond initial payment aren't confirmed to be handled.
- **No automated moderation pre-pass** — moderation is entirely reactive (user reports → admin review).
- **No push notification delivery mechanism** — streak/flashcard/reply reminders have nothing to send them.
- **No i18n/RTL support** — notable given the platform's Arabic branding.

---

## 5. Working Principles for Any Task on This Project

1. **Identify the tier and app first.** State which of notes/ai_engine/rag/flashcards/planner/analytics/messages/payments (or which mobile route group) a task touches before writing code or specs.
2. **Respect MongoDB as the single source of truth.** All user records, roles, content, logs, and metadata are master-stored in MongoDB. The local SQLite database is only a replica/shadow for Django's token/session subsystems.
3. **Preserve role scoping.** Every new endpoint or screen declares which role(s) — student, instructor, admin — it serves, and doesn't leak another role's data shape.
4. **Match existing conventions over inventing new ones.** Mock fallbacks for AI calls, fixed and explicit XP rates, 500-word/50-word-overlap chunking — follow these unless there's a clearly stated reason to deviate.
5. **Surface known gaps rather than silently building on them.** If new work would make a gap (no vector index, no webhooks, no moderation pre-pass) load-bearing rather than theoretical, say so before proceeding.
6. **Default to extending one of the eight existing Django apps.** A new app is justified only when a feature has no honest home in the existing module map.
7. **Enforce Single Source of Truth.** Consume themes (`colors`), localization (`t`, `locale`), and authentication data from the centralized `useWamdh()` context rather than calling `useColorScheme()`, `useLanguageStore()`, or `useAuthStore()` directly in UI screens. This prevents synchronization issues.
8. **Invalidate Cache on Mutations.** For any mutation or upload that updates profile data (e.g., bio, profile photo), always call `refreshUser()` (which invalidates the React Query `['profile']` cache) to propagate the update across all screens immediately.
9. **Secure payments configuration.** Ensure that payment views use environment variables properly mapped via Django settings, and keep `apps.payments` registered in `INSTALLED_APPS` for unified Django app configuration.

---

## 6. State Management & Theme/Localization Architecture

Wamdh implements a "Single Source of Truth" architecture for robust state management:
- **Unified Consumption Layer:** `WamdhContext` serves as the centralized interface for theme colors (`colors`, `isDark`), locale/i18n (`locale`, `t`, `isRtl`), and authenticated session data (`user`, `logout`).
- **State Partitioning:**
  - Zustand stores (`authStore`, `themeStore`, `languageStore`) handle client-side atomic state slices and persistence to SecureStore.
  - React Query handles caching and synchronization of server-state (like user profiles, note directories, planner tasks).
- **Cache Synchronization:** Multi-screen updates (such as updating profile images) are synchronized by calling `refreshUser()` to invalidate key queries, triggering automatic, responsive UI updates.
- **Theme Colors Design Tokens:** Semantic components must utilize `colors` parameters (like `colors.accent`, `colors.danger`, `colors.success`, etc.) to guarantee responsive light/dark transitioning.

