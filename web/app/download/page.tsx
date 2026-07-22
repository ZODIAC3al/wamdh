"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

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
  const [downloadState, setDownloadState] = useState<{
    status: "idle" | "downloading" | "verifying" | "completed" | "error";
    progress: number;
    loadedBytes: number;
    totalBytes: number;
    errorMessage: string;
  }>({
    status: "idle",
    progress: 0,
    loadedBytes: 0,
    totalBytes: 0,
    errorMessage: "",
  });

  const expoUri = "exp://u.expo.dev/178355d6-0c6c-45a2-9174-46a00d33664f";

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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const triggerApkDownload = async () => {
    try {
      setDownloadState({
        status: "downloading",
        progress: 0,
        loadedBytes: 0,
        totalBytes: 0,
        errorMessage: "",
      });

      const response = await fetch("/api/download");
      if (!response.ok) {
        throw new Error(`Download failed with server status ${response.status}`);
      }

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            const progress = total > 0 ? Math.round((loaded / total) * 100) : 50;
            setDownloadState({
              status: "downloading",
              progress,
              loadedBytes: loaded,
              totalBytes: total,
              errorMessage: "",
            });
          }
        }
      }

      setDownloadState((prev) => ({ ...prev, status: "verifying", progress: 99 }));

      const blob = new Blob(chunks as unknown as BlobPart[], { type: "application/vnd.android.package-archive" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wamdh.apk";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadState({
        status: "completed",
        progress: 100,
        loadedBytes: loaded,
        totalBytes: total,
        errorMessage: "",
      });
    } catch (err: any) {
      console.error("APK Download error:", err);
      setDownloadState({
        status: "error",
        progress: 0,
        loadedBytes: 0,
        totalBytes: 0,
        errorMessage: err?.message || "Download failed. Please click retry.",
      });
    }
  };

  const platforms: Platform[] = [
    {
      id: "android",
      name: "Android",
      description:
        "Install the production standalone APK directly on Android 8 through 15 devices with full camera OCR, audio, and offline access.",
      icon: "🤖",
      buttonText: "📥 Download Standalone APK",
      buttonHref: "/api/download",
      buttonStyle:
        "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
      features: [
        "Android 8+ - 15+ supported",
        "Direct installation",
        "Camera OCR & Audio scan",
        "Offline storage & cache",
      ],
    },
    {
      id: "ios",
      name: "iOS",
      description:
        "Join the official Apple TestFlight developer pool. Preview new releases on your iPhone before they hit the App Store.",
      icon: "🍎",
      buttonText: "🚀 Request TestFlight Access",
      buttonHref: "https://testflight.apple.com/join/YOUR_TESTFLIGHT_LINK",
      buttonStyle: "bg-white/10 hover:bg-white/20 border border-white/15",
      features: [
        "Face ID/Touch ID",
        "iCloud sync",
        "Dark mode",
        "Haptic feedback",
      ],
    },
    {
      id: "expo",
      name: "Expo Go",
      description:
        "Scan this premium QR code using your device's camera to run the app inside the sandboxed Expo Go client instantly.",
      icon: "📱",
      buttonText: "📱 Open in Expo Go",
      buttonHref: "#qr",
      buttonStyle: "bg-emerald-600 hover:bg-emerald-500",
      features: [
        "Instant updates",
        "No install needed",
        "Live reload",
        "Web preview",
      ],
    },
  ];

  const allFeatures: Feature[] = [
    {
      icon: "📝",
      title: "Smart Notes",
      desc: "OCR extraction, AI summaries, and semantic search across all your study materials.",
    },
    {
      icon: "❓",
      title: "AI-Generated Quizzes",
      desc: "Convert any note into multiple-choice, true/false, or short answer questions instantly.",
    },
    {
      icon: "🗂️",
      title: "Spaced Repetition Flashcards",
      desc: "SM-2 algorithm schedules reviews based on your recall performance.",
    },
    {
      icon: "📅",
      title: "AI Study Planner",
      desc: "Input exam dates and get daily task breakdowns optimized for your schedule.",
    },
    {
      icon: "🤖",
      title: "AI Chat Tutor",
      desc: "Context-aware conversations about your notes with ELI5 mode for simplified explanations.",
    },
    {
      icon: "💬",
      title: "Study Community",
      desc: "Join study groups, share resources, complete missions, and earn XP achievements.",
    },
    {
      icon: "⚡",
      title: "Code Playground",
      desc: "Multi-language coding sandbox with Judge0 integration and practice challenges.",
    },
    {
      icon: "🏆",
      title: "Gamification",
      desc: "50+ achievements, XP system, level progression, and community leaderboards.",
    },
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
          Get{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-amber-300">
            Wamdh Study OS
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mb-16 max-w-xl mx-auto leading-relaxed">
          Download the verified production APK directly to your device or scan the QR code to run inside Expo Go.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 text-left">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`
              bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col 
              transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] 
              group relative overflow-hidden
              ${detectedPlatform === platform.id ? "ring-2 ring-violet-400" : ""}
            `}
            >
              {detectedPlatform === platform.id && (
                <div className="absolute -top-2 -right-2 bg-violet-400 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  Recommended
                </div>
              )}
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                <span className="text-2xl">{platform.icon}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400 mb-2">
                {platform.name} Build
              </span>
              <h2 className="text-2xl font-bold text-white mb-3">
                {platform.name === "Expo Go"
                  ? "Expo Sandbox Preview"
                  : platform.name === "Android"
                    ? "Standalone APK"
                    : "Apple Beta"}
              </h2>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                {platform.description}
              </p>
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
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 100 100"
                      fill="none"
                    >
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
              ) : platform.id === "android" ? (
                <div className="mt-auto flex flex-col gap-3">
                  {downloadState.status === "idle" && (
                    <button
                      onClick={triggerApkDownload}
                      className={`
                        w-full ${platform.buttonStyle} text-white text-center py-3.5 rounded-2xl 
                        font-semibold transition-all duration-200 shadow-lg shadow-violet-900/30 
                        hover:scale-[1.02] flex items-center justify-center gap-2
                      `}
                    >
                      <span>📥</span> Download Standalone APK
                    </button>
                  )}

                  {(downloadState.status === "downloading" ||
                    downloadState.status === "verifying") && (
                    <div className="bg-black/30 border border-violet-500/30 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-violet-300">
                          {downloadState.status === "verifying"
                            ? "Verifying File Package..."
                            : "Downloading APK..."}
                        </span>
                        <span className="text-white">{downloadState.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-indigo-400 h-full transition-all duration-200"
                          style={{ width: `${downloadState.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>
                          {formatSize(downloadState.loadedBytes)} /{" "}
                          {downloadState.totalBytes > 0
                            ? formatSize(downloadState.totalBytes)
                            : "Calculating..."}
                        </span>
                        <span>application/vnd.android.package-archive</span>
                      </div>
                    </div>
                  )}

                  {downloadState.status === "completed" && (
                    <div className="flex flex-col gap-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2">
                        <span>✅</span> Download completed successfully!
                      </div>
                      <button
                        onClick={triggerApkDownload}
                        className="text-xs text-violet-400 hover:text-violet-300 font-semibold underline text-center"
                      >
                        Download again
                      </button>
                    </div>
                  )}

                  {downloadState.status === "error" && (
                    <div className="flex flex-col gap-2">
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs">
                        ⚠️ {downloadState.errorMessage}
                      </div>
                      <button
                        onClick={triggerApkDownload}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white text-center py-3 rounded-2xl font-semibold text-xs"
                      >
                        🔄 Retry Download
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={platform.buttonHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    w-full ${platform.buttonStyle} text-white text-center py-3.5 rounded-2xl 
                    font-semibold transition-all duration-200 shadow-lg shadow-violet-900/30 
                    hover:scale-[1.02] mt-auto flex items-center justify-center gap-2
                  `}
                >
                  <span>🚀</span> Request TestFlight Access
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto text-left mb-16">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>⚙️</span> Android 8 – 15 APK Installation Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div className="flex gap-3">
              <span className="text-xl font-bold text-violet-400 bg-violet-500/10 w-8 h-8 rounded-full flex items-center justify-center border border-violet-500/20 shrink-0">
                1
              </span>
              <div>
                <p className="font-bold text-white mb-1">Download APK File</p>
                <p>
                  Tap the download button to stream <code className="bg-black/30 px-1 rounded">wamdh.apk</code> to your device storage.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl font-bold text-violet-400 bg-violet-500/10 w-8 h-8 rounded-full flex items-center justify-center border border-violet-500/20 shrink-0">
                2
              </span>
              <div>
                <p className="font-bold text-white mb-1">
                  Allow Unknown Sources
                </p>
                <p>
                  Go to <strong>Settings &gt; Security / Apps</strong> and allow permission to install apps from your web browser.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl font-bold text-violet-400 bg-violet-500/10 w-8 h-8 rounded-full flex items-center justify-center border border-violet-500/20 shrink-0">
                3
              </span>
              <div>
                <p className="font-bold text-white mb-1">Install & Launch</p>
                <p>
                  Open the downloaded APK file from notifications or File Manager to finish installation and open Wamdh.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-left">
          <h2 className="text-3xl font-bold text-white mb-2">
            All Features Included
          </h2>
          <p className="text-gray-400 mb-10 max-w-lg">
            Every feature from our AI-powered learning platform in one unified mobile experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="text-2xl bg-violet-500/10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex justify-center gap-6">
          <Link
            href="/features"
            className="text-violet-400 hover:text-violet-300 font-semibold transition-all"
          >
            Feature Documentation →
          </Link>
          <Link
            href="/pricing"
            className="text-gray-400 hover:text-gray-300 font-semibold transition-all"
          >
            View Pricing Plans →
          </Link>
        </div>
      </div>
    </main>
  );
}
