import type { UserRole } from "../store/authStore";

export interface HubFeature {
  label: string;
  sub: string;
  icon: string;
  color: string;
  route: string;
}

export interface HubCategory {
  title: string;
  features: HubFeature[];
}

const STUDENT_HUB: HubCategory[] = [
  {
    title: "Study Tools",
    features: [
      { label: "Quiz Center", sub: "Take AI quizzes", icon: "help-circle-outline", color: "#10B981", route: "/(student)/quiz" },
      { label: "Flashcards", sub: "SM-2 review decks", icon: "albums-outline", color: "#3B82F6", route: "/(student)/flashcards" },
      { label: "Study Planner", sub: "Daily schedule", icon: "calendar-outline", color: "#BE1A1A", route: "/(student)/planner" },
      { label: "Focus Timer", sub: "Pomodoro sessions", icon: "timer-outline", color: "#EF4444", route: "/(student)/planner/timer" },
      { label: "Downloads", sub: "Offline content", icon: "cloud-download-outline", color: "#06B6D4", route: "/(student)/notes/bookmarks" },
      { label: "AI Voice Tutor", sub: "Talk to Mona", icon: "mic-outline", color: "#BE1A1A", route: "/(student)/ai/voice" },
      { label: "AI Lecture Gen", sub: "Auto lecture notes", icon: "easel-outline", color: "#D0311E", route: "/(student)/notes/lecture" },
      { label: "Mock Exam Sim", sub: "Mixed format simulations", icon: "school-outline", color: "#F59E0B", route: "/(student)/quiz/practice" },
      { label: "Code Playground", sub: "Multi-language coding", icon: "code-slash-outline", color: "#336791", route: "/(student)/sandbox" },
    ],
  },
  {
    title: "Analytics & AI",
    features: [
      { label: "Analytics", sub: "Study insights", icon: "analytics-outline", color: "#3B82F6", route: "/(student)/analytics" },
      { label: "Exam Predictor", sub: "AI predicted weighting", icon: "trending-up-outline", color: "#EF4444", route: "/(student)/analytics/exam-predictor" },
      { label: "AI Search", sub: "Semantic notes search", icon: "search-outline", color: "#6366F1", route: "/(student)/search" },
      { label: "XP & Shop", sub: "Redeem streak freeze", icon: "ribbon-outline", color: "#F59E0B", route: "/(student)/profile/xp-shop" },
      { label: "Mindmap", sub: "Visual study map", icon: "git-merge-outline", color: "#8B5CF6", route: "/(student)/mindmap" },
      { label: "Whiteboard", sub: "Sketch notes", icon: "brush-outline", color: "#EC4899", route: "/(student)/whiteboard" },
      { label: "Bilingual Glossary", sub: "Arabic-English terms", icon: "language-outline", color: "#10B981", route: "/(student)/vocab" },
    ],
  },
  {
    title: "Social & Extras",
    features: [
      { label: "Study Community", sub: "Study groups & missions", icon: "people-outline", color: "#8B5CF6", route: "/(student)/community" },
      { label: "Wamdh Store", sub: "Themes & power-ups shop", icon: "cart-outline", color: "#F59E0B", route: "/(student)/premium/store" },
      { label: "Study Rooms", sub: "Live group chat", icon: "chatbubbles-outline", color: "#3B82F6", route: "/(student)/groups/rooms" },
      { label: "Leaderboard", sub: "Weekly ranks", icon: "trophy-outline", color: "#F59E0B", route: "/(student)/leaderboard" },
      { label: "GPA Calculator", sub: "Grade tracker", icon: "school-outline", color: "#8B5CF6", route: "/(student)/analytics/gpa" },
    ],
  },
];

const INSTRUCTOR_HUB: HubCategory[] = [
  {
    title: "Teaching Tools",
    features: [
      { label: "Quiz Builder", sub: "Create question banks", icon: "construct-outline", color: "#10B981", route: "/(instructor)/quiz/build" },
      { label: "Assignments", sub: "Distribute & AI grade", icon: "clipboard-outline", color: "#3B82F6", route: "/(instructor)/assignments" },
      { label: "Exam Creator", sub: "Syllabus scheduling", icon: "timer-outline", color: "#EF4444", route: "/(instructor)/courses" },
      { label: "Announcements", sub: "Broadcast updates", icon: "megaphone-outline", color: "#F59E0B", route: "/(instructor)/announcements" },
      { label: "Office Hours", sub: "Calendar scheduling", icon: "calendar-outline", color: "#8B5CF6", route: "/(instructor)/messages" },
    ],
  },
  {
    title: "AI & Analytics",
    features: [
      { label: "Course Analytics", sub: "At-Risk tracking", icon: "bar-chart-outline", color: "#BE1A1A", route: "/(instructor)/analytics" },
      { label: "AI Lesson Gen", sub: "Auto syllabus mapping", icon: "sparkles-outline", color: "#6366F1", route: "/(instructor)/courses/create" },
      { label: "Classroom", sub: "Live session & TA", icon: "easel-outline", color: "#06B6D4", route: "/(instructor)/classroom" },
      { label: "Syllabus Gaps", sub: "Compare note coverage", icon: "analytics-outline", color: "#EC4899", route: "/(instructor)/analytics" },
      { label: "Plagiarism Check", sub: "Semantic copy matches", icon: "document-text-outline", color: "#6B7280", route: "/(instructor)/assignments" },
    ],
  },
];

const ADMIN_HUB: HubCategory[] = [
  {
    title: "Platform Management",
    features: [
      { label: "API Quota Control", sub: "Gemini cost limits", icon: "speedometer-outline", color: "#BE1A1A", route: "/(admin)/settings" },
      { label: "Prompt Playground", sub: "Edit LLM templates", icon: "code-working-outline", color: "#6366F1", route: "/(admin)/settings" },
      { label: "Security & GDPR", sub: "Logs & compliance data", icon: "shield-outline", color: "#EF4444", route: "/(admin)/analytics?tab=security" },
      { label: "System Telemetry", sub: "Celery task queue", icon: "server-outline", color: "#6B7280", route: "/(admin)/system/monitor" },
    ],
  },
  {
    title: "Operations",
    features: [
      { label: "Stripe Dashboard", sub: "Billing & LTV metrics", icon: "card-outline", color: "#10B981", route: "/(admin)/analytics?tab=content" },
      { label: "Moderation Queue", sub: "Toxic message logs", icon: "flag-outline", color: "#F59E0B", route: "/(admin)/moderation" },
      { label: "Vector Health", sub: "RAG index latency", icon: "pulse-outline", color: "#06B6D4", route: "/(admin)/system/monitor" },
      { label: "Referral Manager", sub: "Affiliate & promo stats", icon: "people-outline", color: "#EC4899", route: "/(admin)/settings" },
      { label: "Audit Logs", sub: "System action history", icon: "document-text-outline", color: "#3B82F6", route: "/(admin)/system/monitor" },
    ],
  },
];

export function getHubCatalog(role: UserRole): HubCategory[] {
  switch (role) {
    case "student":
      return STUDENT_HUB;
    case "instructor":
      return INSTRUCTOR_HUB;
    case "admin":
      return ADMIN_HUB;
    default:
      return [];
  }
}
