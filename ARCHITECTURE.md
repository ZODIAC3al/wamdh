# Wamdh Study Community Platform - Architecture & Design

## Overview
A WhatsApp-like social learning ecosystem with integrated knowledge graph and gamification.

## Core Architecture

### 1. Role-Based Access Control
```
Roles:
- Student: Access groups, chat, share notes, earn XP
- Instructor: Create groups, moderate, announce, view analytics
- Admin: Platform management, user oversight, system settings
```

### 2. Social Communication Layer (WhatsApp Pattern)

#### Real-time Messaging Stack
- **WebSocket Channel**: `/ws/chat/{group_id}/` for instant messaging
- **Message Types**: Text, Image, Sticker, File, Poll, Quiz
- **Status Sync**: Online/typing indicators via Redis pub/sub
- **Message Persistence**: MongoDB for chat history + SQLite for offline sync

#### Conversation Features
- End-to-end message threading
- Reply-to context (nested messages)
- Message reactions (👍, 🔥, 🎯, etc.)
- Edit/delete own messages within 15min window
- Disappearing messages (24h, 7d, 90d options)

### 3. Integrated Text Editor

#### Core Editor Component (`/mobile/src/components/RichTextEditor.tsx`)
```tsx
Features:
- Markdown support with live preview
- LaTeX equation rendering
- Code block syntax highlighting (multiple languages)
- Image embedding from camera/gallery
- Voice-to-text integration
- AI-powered grammar/syntax suggestions
- Auto-save drafts every 30 seconds
```

### 4. Knowledge Graph Engine

#### Auto-Evolving Graph Structure
```python
# Backend Graph Processor (apps/rag/graph_engine.py)
- Node Types: Concept, Topic, Note, Quiz, Flashcard, Person
- Edge Types: PREREQUISITE, RELATED_TO, STUDIED_BY, AUTHORED_BY
- Auto-mapping: NLP extracts topics from notes → creates/updates nodes
- Evolution: Weekly graph refinement based on study patterns
- Visualization: Cytoscape.js for interactive graph view
```

#### Graph API Endpoints
- `GET /api/graph/user/{id}/` - Personal knowledge graph
- `GET /api/graph/shared/{topic}/` - Shared community graph
- `POST /api/graph/query/` - Semantic search across nodes

### 5. Gamification System

#### Achievement Structure
```
Points Sources:
- Daily login: 10 XP
- Note created: 25 XP
- Quiz completed: 50 XP
- Group contribution: 30 XP
- Streak maintained: 100 XP/day (multiplier)
- Knowledge mastery: 200 XP per topic completed
```

#### Achievement Badges
- **Bronze (0-500 XP)**: First Steps, Note Taker, Chat Participant
- **Silver (500-2000 XP)**: Study Sprinter, Group Leader, Quiz Master
- **Gold (2000-5000 XP)**: Knowledge Builder, Community Champion, Streak Legend
- **Platinum (5000+ XP)**: Expert Scholar, Mentor Level, Graph Master

### 6. Localization Framework

#### Supported Languages
- Arabic (RTL support)
- English (LTR)
- Spanish
- French
- German

#### Implementation
- Translation keys in `/mobile/i18n/` 
- Dynamic locale switching via context
- Date/time formatting per locale
- Number formatting per locale

### 7. Visual Design System

#### Color Palette
```
Primary: #BE1A1A (Wamdh Red)
Secondary: #10B981 (Success Green)
Accent: Theme-based from WamdhContext
Background: Dynamic (light/dark aware)
Card: #FFFFFF / #1A1A2E
Border: #E5E7EB / #2E2E50
```

#### Component Library
- Glassmorphism cards for content
- Neumorphic buttons for actions
- Animated progress rings
- Skeleton loaders for data states

### 8. Navigation Structure

#### Student Tabs (5 total)
1. Home - Dashboard, announcements
2. Notes - Personal knowledge base
3. AI Tutor - Center FAB with sparkles
4. Messages - Direct/group chats
5. Profile - Stats, settings

#### Wamdh Hub (Floating Action Button)
- Quiz Center
- Flashcards
- Study Planner
- Focus Timer
- Study Community ← **NEW**
- Whiteboard
- Analytics

### 9. User Tutorial

#### Onboarding Flow
1. **Welcome Screen**: Platform overview animation
2. **Role Selection**: Student/Instructor/Admin picker
3. **Feature Tour**: Interactive walkthrough
   - Tap to create first note
   - Join study group demo
   - Try AI Tutor with sample question
   - Set up study schedule

#### Contextual Hints
- First-visit tooltips on each screen
- "Did you know?" cards for hidden features
- Progress checklist for completionist gamification

### 10. Technical Stack

#### Frontend (Expo/React Native)
- expo-router v56 for navigation
- react-native-webview for graph visualization
- @shopify/react-native-skia for charts/animations
- react-native-safe-area-context for proper insets
- i18next for localization

#### Backend (Django REST)
- Channels for WebSocket support
- Celery for async graph processing
- SentenceTransformers for embeddings
- MongoDB for chat storage
- PostgreSQL for relational data

#### Deployment
- Expo Application Services (EAS) for builds
- Docker for backend services
- Redis for caching/sessions
- S3-compatible storage for media

### 11. Security & Privacy

- JWT token authentication
- End-to-end encryption for private groups
- GDPR compliance for data export/deletion
- Content moderation API for toxic messages
- Optional anonymous posting mode