"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Platform {
  id: string;
  name: string;
  description: string;
  icon: string;
  buttonText: string;
  buttonHref: string;
  buttonStyle: string;
  features: string[];
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const expoUri = "exp://u.expo.dev/project-id";

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/android/i.test(userAgent)) {
      setDetectedPlatform("android");
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      setDetectedPlatform("ios");
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(expoUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms: Platform[] = [
    {
      id: "android",
      name: "Android",
      description: "Install the high-performance native app bundle directly to unlock all features, camera OCR scanning, and offline study records.",
      icon: "🤖",
      buttonText: "📥 Download Standalone APK",
      buttonHref: "/downloads/wamdh.apk",
      buttonStyle: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
      features: ["Offline mode", "Camera OCR", "Push notifications", "Biometric auth"],
    },
    {
      id: "ios",
      name: "iOS",
      description: "Join the official Apple TestFlight developer pool. Preview new releases on your iPhone before they hit the App Store.",
      icon: "🍎",
      buttonText: "🚀 Request TestFlight Access",
      buttonHref: "https://testflight.apple.com/join/YOUR_TESTFLIGHT_LINK",
      buttonStyle: "bg-white/10 hover:bg-white/20 border border-white/15",
      features: ["Face ID/Touch ID", "iCloud sync", "Dark mode", "Haptic feedback"],
    },
    {
      id: "expo",
      name: "Expo Go",
      description: "Scan this premium QR code using your device's camera to run the app inside the sandboxed Expo Go client instantly.",
      icon: "📱",
      buttonText: "📱 Open in Expo Go",
      buttonHref: "#qr",
      buttonStyle: "bg-emerald-600 hover:bg-emerald-500",
      features: ["Instant updates", "No install needed", "Live reload", "Web preview"],
    },
  ];

  const allFeatures: Feature[] = [
    { icon: "📝", title: "Smart Notes", desc: "OCR extraction, AI summaries, and semantic search across all your study materials." },
    { icon: "❓", title: "AI-Generated Quizzes", desc: "Convert any note into multiple-choice, true/false, or short answer questions instantly." },
    { icon: "🗂️", title: "Spaced Repetition Flashcards", desc: "SM-2 algorithm schedules reviews based on your recall performance." },
    { icon: "📅", title: "AI Study Planner", desc: "Input exam dates and get daily task breakdowns optimized for your schedule." },
    { icon: "🤖", title: "AI Chat Tutor", desc: "Context-aware conversations about your notes with ELI5 mode for simplified explanations." },
    { icon: "💬", title: "Study Community", desc: "Join study groups, share resources, complete missions, and earn XP achievements." },
    { icon: "⚡", title: "Code Playground", desc: "Multi-language coding sandbox with Judge0 integration and practice challenges." },
    { icon: "🏆", title: "Gamification", desc: "50+ achievements, XP system, level progression, and community leaderboards." },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0F0F1A] via-[#15152A] to-[#0A0A14] text-gray-200 py-20 px-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#F59E0B]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-violet-400 mb-6 uppercase tracking-wider">
          <span>✨</span> Instantly Level Up Your Grades
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
          Get <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-amber-300">Wamdh Study OS</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mb-16 max-w-xl mx-auto leading-relaxed">
          Scan the QR code to run instantly inside the Expo Go sandbox, or download the direct standalone builds below.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 text-left">
          {platforms.map((platform) => (
            <div key={platform.id} className={`
              bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col 
              transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] 
              group relative overflow-hidden
              ${detectedPlatform === platform.id ? "ring-2 ring-violet-400" : ""}
            `}>
              {detectedPlatform === platform.id && (
                <div className="absolute -top-2 -right-2 bg-violet-400 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  Recommended
                </div>
              )}
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                <span className="text-2xl">{platform.icon}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400 mb-2">{platform.name} Build</span>
              <h2 className="text-2xl font-bold text-white mb-3">{platform.name === "Expo Go" ? "Expo Sandbox Preview" : platform.name === "Android" ? "Standalone APK" : "Apple Beta"}</h2>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{platform.description}</p>
              <ul className="text-xs text-gray-500 mb-6 space-y-1">
                {platform.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-violet-400">•</span> {f}
                  </li>
                ))}
              </ul>
              {platform.id === "expo" ? (
                <div className="flex flex-col items-center mb-4">
                  <div className="w-32 h-32 bg-white rounded-2xl p-2.5 shadow-2xl relative flex items-center justify-center border border-white/10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                      <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
                      <rect x="8" y="8" width="24" height="24" fill="#7C3AED" rx="4" />
                      <rect x="14" y="14" width="12" height="12" fill="#FFFFFF" rx="2" />
                      <rect x="17" y="17" width="6" height="6" fill="#F59E0B" rx="1" />
                      <rect x="68" y="8" width="24" height="24" fill="#7C3AED" rx="4" />
                      <rect x="74" y="74" width="12" height="12" fill="#FFFFFF" rx="2" />
                      <rect x="8" y="68" width="24" height="24" fill="#7C3AED" rx="4" />
                      <rect x="14" y="74" width="12" height="12" fill="#FFFFFF" rx="2" />
                      <rect x="40" y="8" width="8" height="8" fill="#1F2937" rx="1" />
                      <rect x="52" y="16" width="8" height="8" fill="#7C3AED" rx="1" />
                      <rect x="40" y="28" width="12" height="8" fill="#1F2937" rx="1" />
                      <rect x="8" y="40" width="8" height="12" fill="#7C3AED" rx="1" />
                      <rect x="24" y="44" width="12" height="8" fill="#1F2937" rx="1" />
                      <rect x="40" y="44" width="20" height="20" fill="#7C3AED" rx="2" />
                      <rect x="68" y="40" width="8" height="16" fill="#1F2937" rx="1" />
                      <rect x="80" y="68" width="12" height="12" fill="#7C3AED" rx="2" />
                      <rect x="68" y="80" width="12" height="12" fill="#1F2937" rx="2" />
                      <rect x="44" y="44" width="12" height="12" fill="#FFFFFF" rx="2" />
                      <path d="M46 50 L50 47 L54 50 L50 53 Z" fill="#F59E0B" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono mt-3 select-all bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                    <span>{expoUri}</span>
                    <button
                      onClick={handleCopy}
                      className="text-violet-400 hover:text-violet-300 font-sans text-[10px] font-bold px-1.5 py-0.5 rounded transition-all bg-white/5"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </span>
                </div>
              ) : (
                <a
                  href={platform.buttonHref}
                  download={platform.id === "android"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    w-full ${platform.buttonStyle} text-white text-center py-3.5 rounded-2xl 
                    font-semibold transition-all duration-200 shadow-lg shadow-violet-900/30 
                    hover:scale-[1.02] mt-auto flex items-center justify-center gap-2
                  `}
                >
                  <span>{platform.buttonText.split(" ")[0]}</span> {platform.buttonText.split(" ").slice(1).join(" ")}
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto text-left mb-16">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>⚙️</span> Android APK Installation Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div className="flex gap-3">
              <span className="text-xl font-bold text-violet-400 bg-violet-500/10 w-8 h-8 rounded-full flex items-center justify-center border border-violet-500/20 shrink-0">1</span>
              <div>
                <p className="font-bold text-white mb-1">Download APK</p>
                <p>Click the "Download Standalone APK" button to save the <code className="bg-black/30 px-1 rounded">wamdh.apk</code> file on your device.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl font-bold text-violet-400 bg-violet-500/10 w-8 h-8 rounded-full flex items-center justify-center border border-violet-500/20 shrink-0">2</span>
              <div>
                <p className="font-bold text-white mb-1">Allow Unknown Sources</p>
                <p>Go to Settings &gt; Security &gt; Install Unknown Apps, and toggle permission for your browser.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl font-bold text-violet-400 bg-violet-500/10 w-8 h-8 rounded-full flex items-center justify-center border border-violet-500/20 shrink-0">3</span>
              <div>
                <p className="font-bold text-white mb-1">Install & Play</p>
                <p>Tap the download notification or open the APK file from your file manager to run installation.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-left">
          <h2 className="text-3xl font-bold text-white mb-2">All Features Included</h2>
          <p className="text-gray-400 mb-10 max-w-lg">
            Every feature from our AI-powered learning platform in one unified mobile experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allFeatures.map((feat, idx) => (
              <div key={idx} className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-2xl bg-violet-500/10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{feat.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex justify-center gap-6">
          <Link href="/features" className="text-violet-400 hover:text-violet-300 font-semibold transition-all">
            Feature Documentation →
          </Link>
          <Link href="/pricing" className="text-gray-400 hover:text-gray-300 font-semibold transition-all">
            View Pricing Plans →
          </Link>
        </div>
      </div>
    </main>
  );
}