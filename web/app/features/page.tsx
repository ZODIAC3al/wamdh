import React from "react";
import Link from "next/link";

export default function FeaturesPage() {
  const sections = [
    {
      title: "Notes & Document Processing",
      features: [
        { icon: "📝", title: "Smart Notes", desc: "Upload notes as PDF or images and extract clean, readable study text instantly via local OCR." },
        { icon: "⚡", title: "AI Summaries", desc: "Generate bullet point lists or structured study guides from long documents automatically." },
        { icon: "🔍", title: "Semantic Search", desc: "AI-powered vector search finds related concepts across your entire note library." },
      ]
    },
    {
      title: "Assessment & Practice",
      features: [
        { icon: "❓", title: "Quiz Generator", desc: "Turn note topics into multiple-choice test questions with instant correctness scoring and explanations." },
        { icon: "🗂️", title: "Flashcards Spacing", desc: "Review key facts using card decks managed by the scientific SM-2 Spaced Repetition scheduler." },
        { icon: "📅", title: "Study Planner", desc: "Set your exam target date and hours, and let the AI build your daily checklist calendar." },
      ]
    },
    {
      title: "AI Assistant",
      features: [
        { icon: "🤖", title: "AI Chat Tutor", desc: "Have context-aware conversations with Gemini about note formulas or concepts, with togglable ELI5 mode." },
        { icon: "🎤", title: "Voice Tutor", desc: "Speak your questions aloud and get real-time voice responses from your AI study companion." },
      ]
    },
    {
      title: "Coding Academy",
      features: [
        { icon: "⚡", title: "Code Playground", desc: "Multi-language coding sandbox with Judge0 integration supporting 14+ programming languages." },
        { icon: "🎯", title: "Practice Challenges", desc: "Complete coding challenges and earn XP rewards. From array sums to algorithm optimization." },
        { icon: "🤖", title: "AI Code Explainer", desc: "Get instant code analysis and improvement suggestions powered by Gemini AI." },
      ]
    },
    {
      title: "Community & Gamification",
      features: [
        { icon: "💬", title: "Study Community", desc: "Join study groups, share resources, and collaborate with peers on assignments." },
        { icon: "🏆", title: "50+ Achievements", desc: "Earn XP and unlock badges for quizzes, flashcards, notes, community participation, and coding." },
        { icon: "📊", title: "Leaderboard", desc: "Compete with friends on weekly XP rankings and challenge completions." },
        { icon: "🎯", title: "Community Missions", desc: "Complete weekly missions to earn bonus XP and climb the community leaderboard." },
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[#0F0F1A] text-gray-200 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white text-center mb-4">
          Wamdh Feature Showcase
        </h1>
        <p className="text-gray-400 text-center text-lg mb-16 max-w-lg mx-auto">
          Explore the architectural capabilities of our learning operating system.
        </p>

        <div className="space-y-20">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              <h2 className="text-2xl font-bold text-violet-400 mb-6">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {section.features.map((feature, fIdx) => (
                  <div
                    key={fIdx}
                    className="bg-white/5 border border-white/10 hover:border-violet-500/30 rounded-2xl p-6 transition-all shadow-sm"
                  >
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-6">
            Download Wamdh Study OS and transform your learning experience today.
          </p>
          <Link
            href="/download"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white py-4 px-10 rounded-full font-bold transition-all shadow-md"
          >
            Download for Android
          </Link>
        </div>
      </div>
    </main>
  );
}