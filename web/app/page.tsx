import React from "react";
import Link from "next/link";

export default function Home() {
  const features = [
    { icon: "📝", title: "Smart Notes", desc: "Upload notes as PDF or images and extract clean, readable study text instantly via local OCR." },
    { icon: "⚡", title: "AI Summaries", desc: "Generate bullet point lists or structured study guides from long documents automatically." },
    { icon: "❓", title: "Quiz Generator", desc: "Turn note topics into multiple-choice test questions with instant correctness scoring and explanations." },
    { icon: "🗂️", title: "Flashcards Spacing", desc: "Review key facts using card decks managed by the scientific SM-2 Spaced Repetition scheduler." },
    { icon: "📅", title: "Study Planner", desc: "Set your exam target date and hours, and let the AI build your daily checklist calendar." },
    { icon: "🤖", title: "AI Chat Tutor", desc: "Have context-aware conversations with Gemini about note formulas or concepts, with togglable ELI5 mode." },
  ];

  const newFeatures = [
    { icon: "💬", title: "Study Community", desc: "Join study groups, share resources, complete missions, and compete on live member leaderboards." },
    { icon: "🏆", title: "52 Achievements", desc: "Unlock 52 unique learning milestones for quizzes, flashcards, playground runs, and message streaks." },
    { icon: "💻", title: "Code Playground", desc: "Multi-language coding sandbox with Judge0 compiler engine, HTML live webview previews, and XP coding challenges." },
  ];

  return (
    <main className="flex-col min-h-screen bg-[#09090E] text-gray-100 overflow-hidden font-sans">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative py-24 px-6 border-b border-gray-800/40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-purple-400 mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              NEW: Wamdh Learning OS v2.0
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Level Up Your Study.<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Accelerate Learning.
              </span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl">
              Upload notes, generate summary decks, practice with spaced flashcards, run code compiles, 
              earn badges, and collaborate in communities. The canonical study platform for builders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/download"
                className="bg-purple-600 hover:bg-purple-500 text-white text-center py-4 px-8 rounded-full font-bold transition-all shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95"
              >
                Download for Android
              </Link>
              <Link
                href="/features"
                className="bg-transparent border border-gray-800 hover:border-purple-500 text-center text-gray-300 hover:text-white py-4 px-8 rounded-full font-bold transition-all hover:bg-purple-500/5"
              >
                View Core Features
              </Link>
            </div>
          </div>

          {/* Interactive Screen Mockups Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
            
            {/* Mockup 1: Community Tab Feed */}
            <div className="bg-[#12121A] border border-purple-500/15 rounded-2xl p-5 shadow-xl hover:border-purple-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Community Hub</span>
              </div>
              <p className="text-xs font-semibold text-gray-200 mb-2">💻 Python Coders Group</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                &quot;Just shared my Spaced Repetition card helper note! Check the Files tab.&quot;
              </p>
              <div className="flex items-center justify-between mt-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">❤️ 28 Likes</span>
                <span>⏱️ Just now</span>
              </div>
            </div>

            {/* Mockup 2: 52 Achievements Badges */}
            <div className="bg-[#12121A] border border-yellow-500/15 rounded-2xl p-5 shadow-xl hover:border-yellow-500/30 transition-all sm:translate-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest">Achievements</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <h4 className="text-xs font-bold text-gray-100">Retention King</h4>
                  <p className="text-[10px] text-yellow-500">Unlocked! +500 XP Awarded</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-yellow-500 h-1.5 rounded-full w-[85%]" />
              </div>
              <p className="text-[9px] text-gray-500 mt-2 text-right">Badge 34 of 52 completed</p>
            </div>

            {/* Mockup 3: Code Sandbox */}
            <div className="bg-[#12121A] border border-green-500/15 rounded-2xl p-5 shadow-xl hover:border-green-500/30 transition-all sm:-translate-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[11px] font-bold text-green-400 uppercase tracking-widest">Code Playground</span>
              </div>
              <div className="bg-[#09090E] p-3 rounded-lg border border-gray-800 font-mono text-[10px] text-green-400">
                <p className="text-gray-600">// Running challenge code...</p>
                <p>$ python main.py</p>
                <p className="text-emerald-400">Stdout: [Array Sum matches! 28]</p>
                <p className="text-yellow-500 font-bold mt-1">🎉 Solution Accepted! (+100 XP)</p>
              </div>
            </div>

            {/* Mockup 4: Study Planner */}
            <div className="bg-[#12121A] border border-blue-500/15 rounded-2xl p-5 shadow-xl hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Study Planner</span>
              </div>
              <p className="text-xs font-semibold text-gray-200">Daily Checklist</p>
              <div className="mt-2.5 gap-2 flex flex-col">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-green-500">✓</span>
                  <span className="line-through">Revise Organic Valency</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-blue-400">⏳</span>
                  <span>Attempt 3 Quiz Questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="bg-[#0C0C14] py-24 px-6 border-b border-gray-800/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white text-center mb-4">
            Next Generation Learning Tools
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-16 leading-relaxed">
            Boost retention rates and learn effectively. Dive into our newest study extensions designed for high-scoring students.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="bg-[#12121F] border border-gray-800/60 hover:border-purple-500/40 rounded-2xl p-8 transition-all hover:-translate-y-1 shadow-lg"
              >
                <div className="text-4xl mb-6">{feat.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Grid */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#09090E] to-[#05050A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white text-center mb-4">
            Core Learning Engines
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-16 leading-relaxed">
            Wamdh simplifies heavy textbook pages, processes data sets, and automates active recalls using local AI.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="bg-[#12121F] border border-gray-800/40 hover:border-indigo-500/30 rounded-2xl p-6 transition-all hover:bg-indigo-950/5"
              >
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 px-6 bg-[#09090E] border-t border-gray-800/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-20">Simple Three Step Setup</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex justify-center items-center text-white text-xl font-bold mb-6 shadow-lg shadow-purple-600/30">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Upload Material</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Upload lectures as PDF or snapshot book pages. Our parser processes math, text, and images.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex justify-center items-center text-white text-xl font-bold mb-6 shadow-lg shadow-purple-600/30">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-3">AI Transformation</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Wamdh indexes data, creates summary points, flashcards spacing schedules, and test questions.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex justify-center items-center text-white text-xl font-bold mb-6 shadow-lg shadow-purple-600/30">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Study & Collaborate</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Attempt coding challenges, share notes in community boards, chat with peers, and level up stats.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}