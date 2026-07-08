"use client";

import React, { useState, useEffect } from "react";

/* ─── Shared Components: PhoneMockup ───────────────────────────────────────── */
interface PhoneMockupProps {
  activeScreen: "chat" | "flashcards" | "planner";
}

function PhoneMockup({ activeScreen }: PhoneMockupProps) {
  return (
    <div className="relative mx-auto w-[280px] h-[570px] bg-[#0A0D1A] rounded-[36px] p-3 border-4 border-[#1E2538] shadow-2xl flex flex-col overflow-hidden">
      {/* Speaker and Notch */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-[#1E2538] rounded-full z-20 flex items-center justify-center">
        <div className="w-12 h-1 bg-black rounded-full" />
      </div>

      {/* Screen Container */}
      <div className="w-full h-full bg-[#121628] rounded-[28px] overflow-hidden relative flex flex-col pt-6 text-white select-none">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center px-5 py-1 text-[11px] text-gray-400 font-medium">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* ─── Screen: Chat ─── */}
        {activeScreen === "chat" && (
          <div className="flex-1 flex flex-col p-4 justify-between">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Mona AI Tutor</h4>
                  <p className="text-[8px] text-emerald-400 font-semibold">Active Study Assistant</p>
                </div>
              </div>
              <span className="bg-violet-500/20 text-violet-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-violet-500/30">ELI5</span>
            </div>

            {/* Chat History */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pt-2 scrollbar-none">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-2.5 max-w-[85%] self-start">
                <p className="text-[10px] text-gray-300">Hi! I parsed your 'Linear Algebra' notes. Ask me anything, or toggle ELI5 to simplify.</p>
              </div>
              <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl p-2.5 max-w-[85%] self-end">
                <p className="text-[10px] text-white">Explain eigenvalues in simple terms.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-2.5 max-w-[85%] self-start">
                <p className="text-[10px] text-gray-300 font-medium">Imagine stretching a grid. Eigenvectors keep their direction; eigenvalues represent how much they stretch! 🚀</p>
              </div>
            </div>

            {/* Input Row */}
            <div className="mt-2 flex gap-1 bg-white/5 border border-white/5 rounded-xl p-1.5 items-center">
              <span className="text-xs px-1 text-gray-400">Ask...</span>
              <div className="ml-auto bg-violet-600 px-2 py-1 rounded-lg text-[9px] font-bold">ELI5: ON</div>
            </div>
          </div>
        )}

        {/* ─── Screen: Flashcards ─── */}
        {activeScreen === "flashcards" && (
          <div className="flex-1 flex flex-col p-4 justify-between">
            <div>
              <p className="text-[10px] text-violet-400 uppercase tracking-wider font-bold">Spaced Repetition</p>
              <h4 className="text-sm font-extrabold text-white">Deck: Medical Physiology</h4>
            </div>

            {/* Card Content */}
            <div className="my-auto bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[160px] flex flex-col justify-center items-center text-center shadow-inner relative">
              <div className="absolute top-2 left-3 bg-violet-500/10 text-violet-400 text-[8px] font-extrabold px-2 py-0.5 rounded-full">Card 14/40</div>
              <p className="text-xs font-bold text-white mb-2">Question:</p>
              <p className="text-[11px] text-gray-300">What is the primary function of mitochondria?</p>
              <div className="mt-4 border-t border-white/10 pt-2 w-full">
                <p className="text-[10px] text-emerald-400 font-bold">Answer: Powerhouse of the cell, generating ATP.</p>
              </div>
            </div>

            {/* SM-2 Review buttons */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[
                { name: "Again", style: "bg-red-500/20 text-red-400 border-red-500/30" },
                { name: "Hard", style: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
                { name: "Good", style: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
                { name: "Easy", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
              ].map((b, i) => (
                <button key={i} className={`py-2 rounded-lg border text-[9px] font-bold text-center ${b.style}`}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Screen: Planner ─── */}
        {activeScreen === "planner" && (
          <div className="flex-1 flex flex-col p-4 justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">AI Planner</p>
              <h4 className="text-sm font-extrabold text-white">Daily Study Checklist</h4>
            </div>

            {/* Task list / Kanban status */}
            <div className="flex-1 flex flex-col gap-2 my-4 overflow-y-auto max-h-[220px] scrollbar-none">
              {[
                { name: "Biology Chapter 4 Review", time: "9:00 AM", done: true },
                { name: "Quiz on Quantum Physics", time: "2:00 PM", active: true },
                { name: "Draft History Essay outline", time: "5:00 PM" },
              ].map((task, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{task.done ? "✅" : task.active ? "⏳" : "📝"}</span>
                    <div>
                      <p className={`text-[10px] font-bold text-white leading-tight ${task.done ? "line-through text-gray-500" : ""}`}>{task.name}</p>
                      <p className="text-[8px] text-gray-500">{task.time}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${task.done ? "bg-emerald-500/10 text-emerald-400" : task.active ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-gray-400"}`}>
                    {task.done ? "Done" : task.active ? "Doing" : "Todo"}
                  </span>
                </div>
              ))}
            </div>

            {/* XP progress bar */}
            <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col gap-1.5 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Level 4 Scholar</span>
                <span className="text-[8px] text-yellow-400 font-extrabold">+150 XP Today 🔥</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-yellow-400 h-full w-[70%] rounded-full" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const testimonials = [
    {
      name: "Nathan Roberts",
      role: "Calculus Student",
      title: "Minimum Effort Maximum Attention",
      text: "As one of the top learning apps, we leverage tools like Wamdh to help build new dynamic revisions. With the least effort of a few clicks."
    },
    {
      name: "Sarah Taylor",
      role: "Product Designer",
      title: "Cleanest Interface Ever",
      text: "The integration works perfectly. The custom schedules allowed us to trim our study hours by nearly 20% in the first winter semester."
    },
    {
      name: "James Anderson",
      role: "UI/UX Engineer",
      title: "Highly Intuitive Layout",
      text: "Configuring presets is incredibly fast, and the smart schedules work seamlessly in the background. Excellent user flows."
    },
    {
      name: "Michael Brown",
      role: "Developer",
      title: "Highly Responsive Mona AI",
      text: "The temperature controller is incredibly responsive. Excellent device alerts and direct feedback for diagnostic warnings."
    },
    {
      name: "Emily Johnson",
      role: "Medical Student",
      title: "Stunning Design & Animations",
      text: "The UI design is clean and gorgeous. The OCR note scanner converted all my medical slides into organized study guides."
    },
    {
      name: "Ahmad Rashid",
      role: "Engineering Student",
      title: "Amazing Spaced Repetition",
      text: "Spaced repetition works like magic. Card intervals adjust perfectly to my recall scores using the SM-2 spaced repetition scheduler."
    }
  ];

  // Auto-scroll reveal initialization
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleDownload = (e: React.MouseEvent) => {
    // Redirect to the dedicated download page for full instructions & Expo/Standalone files
    window.location.href = "/download";
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F8FB] overflow-x-hidden font-sans">
      
      {/* ════════════════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#2547F4]/90 backdrop-blur-md border-b border-white/10 py-4 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          
          {/* Logo (Spark icon + Wamdh wordmark) */}
          <div className="flex items-center gap-2 cursor-pointer">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-white font-extrabold text-lg tracking-tight">Wamdh</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Features", "Pricing", "Download"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-white/80 hover:text-white font-medium text-[15px] transition-colors"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-6">
            <a href="#download" className="text-white/80 hover:text-white font-medium text-[15px] transition-colors">
              Get App
            </a>
            <button
              onClick={handleDownload}
              className="bg-white text-[#2547F4] hover:bg-[#E4E9FF] px-6 py-2.5 rounded-full text-[14px] font-bold tracking-wide transition-all shadow-md"
            >
              Download APK
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION (Vivid Blue, Overlapping Phones)
      ════════════════════════════════════════════════════════════════════ */}
      <section
        id="home"
        className="relative bg-[#2547F4] pt-32 pb-44 px-6 md:px-12 flex items-center overflow-hidden"
        style={{ minHeight: "85vh" }}
      >
        {/* Social Rail (Left edge) */}
        <div className="absolute left-6 bottom-32 hidden lg:flex flex-col gap-10 items-center z-20">
          {["facebook", "twitter", "linkedin", "instagram"].map((soc) => (
            <a key={soc} href={`#${soc}`} className="text-white/70 hover:text-white transition-all transform hover:scale-110">
              <span className="text-[12px] font-bold uppercase tracking-wider">{soc.slice(0, 2)}</span>
            </a>
          ))}
          <div className="w-0.5 h-16 bg-white/20" />
        </div>

        <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column */}
          <div className="lg:col-span-6 text-left flex flex-col items-start">
            <h1 className="text-white font-extrabold text-5xl md:text-6xl lg:text-[64px] leading-[1.05] tracking-tight mb-6 animate-fade-in-up">
              Wamdh Study OS
            </h1>
            <p className="text-[#E4E9FF] text-base md:text-lg max-w-xl leading-relaxed mb-8 animate-fade-in-up delay-100">
              Master your classes with a unified AI study platform. Scan notes with OCR, converse with a context-grounded AI tutor, review spaced cards, and stay on track with smart schedules.
            </p>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 mb-8 w-full animate-fade-in-up delay-200">
              <button
                onClick={handleDownload}
                className="bg-white text-[#2547F4] hover:bg-[#1B35C4] hover:text-white px-8 py-3.5 rounded-full text-[15px] font-extrabold transition-all shadow-xl hover:-translate-y-0.5"
              >
                Get Started
              </button>
              <button onClick={handleDownload} className="flex items-center gap-2 text-white font-bold hover:text-[#E4E9FF] transition-all group">
                <span className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-all">
                  ▶
                </span>
                Watch Demo
              </button>
            </div>

            {/* Store Badges Row */}
            <div className="flex flex-wrap gap-3 animate-fade-in-up delay-300">
              <button onClick={handleDownload} className="store-btn">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <span className="block text-[9px] text-white/50 uppercase leading-none">Download on the</span>
                  <span className="font-bold text-sm">App Store</span>
                </div>
              </button>
              <button onClick={handleDownload} className="store-btn">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.18l12.6-7.27-2.54-2.54-11.05 9.63zm-1.59-20.4A1.5 1.5 0 001.5 4.5v15a1.5 1.5 0 00.09.54l11.43-9.97L1.59 3.36zm19.41 8.49l-2.79-1.61-2.85 2.49 2.85 2.49 2.82-1.62c.8-.46.8-1.29-.03-1.75zM4.17.06L16.77 7.33l-2.54 2.54L3.18.24A1.5 1.5 0 004.17.06z"/>
                </svg>
                <div className="text-left">
                  <span className="block text-[9px] text-white/50 uppercase leading-none">Get it on</span>
                  <span className="font-bold text-sm">Google Play</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: 3 Overlapping Phone Mockups */}
          <div className="lg:col-span-6 relative flex justify-center items-center min-h-[580px] mt-12 lg:mt-0">
            {/* Dotted grid decoration in behind */}
            <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-48 h-48 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent grid grid-cols-6 gap-2">
              {[...Array(36)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
              ))}
            </div>

            {/* Left Phone: Chat */}
            <div className="absolute left-[5%] bottom-0 transform -rotate-6 scale-[0.85] opacity-80 hover:opacity-100 transition-all duration-300 z-10">
              <PhoneMockup activeScreen="chat" />
            </div>

            {/* Center Phone (Raised, Larger, Shadow) */}
            <div className="absolute z-20 shadow-2xl hover:scale-105 transition-all duration-300">
              <PhoneMockup activeScreen="flashcards" />
            </div>

            {/* Right Phone: Planner */}
            <div className="absolute right-[5%] bottom-0 transform rotate-6 scale-[0.85] opacity-80 hover:opacity-100 transition-all duration-300 z-10">
              <PhoneMockup activeScreen="planner" />
            </div>
          </div>

        </div>

        {/* Diagonal Wave Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden line-height-0 transform translate-y-1">
          <svg className="relative block w-full h-[80px]" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="#F7F8FB">
            <path d="M0,0 C300,90 900,20 1200,90 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          ABOUT US
      ════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 md:px-12 bg-[#F7F8FB]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text block */}
          <div className="reveal flex flex-col items-start">
            <span className="text-[#2547F4] text-[14px] font-bold uppercase tracking-widest mb-4">About Wamdh</span>
            <h2 className="text-[#12131A] font-extrabold text-4xl mb-6 leading-tight">
              AI-Powered Personal Study Assistant
            </h2>
            <p className="text-[#6B7280] text-base leading-relaxed mb-8 max-w-xl">
              Experience a unified study workspace. Snap images of your lecture notes or upload PDFs to trigger high-quality OCR text extraction. Our RAG-based search grounds Mona, your study companion, to answer questions with full accuracy from your materials.
            </p>
            <button
              onClick={handleDownload}
              className="bg-[#2547F4] hover:bg-[#1B35C4] text-white px-8 py-3.5 rounded-full text-[14px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20"
            >
              Learn More
            </button>
          </div>

          {/* Right side: Mockup with Floating Orbit Badges */}
          <div className="reveal relative flex justify-center items-center delay-200">
            {/* Dashed Orbit line */}
            <div className="absolute w-[360px] h-[360px] rounded-full border-2 border-dashed border-[#2547F4]/20 animate-spin-slow pointer-events-none" />

            {/* Reusable Phone Mockup */}
            <PhoneMockup activeScreen="chat" />

            {/* 4 Floating Badges */}
            <div className="absolute top-[10%] left-[10%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float">
              🤖
            </div>
            <div className="absolute top-[15%] right-[10%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float-slow">
              📝
            </div>
            <div className="absolute bottom-[20%] left-[5%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float-slow">
              🗂️
            </div>
            <div className="absolute bottom-[15%] right-[5%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float">
              📅
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          OUR CLIENTS (Layered Organic Blob & White Logos)
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-12 bg-white overflow-hidden">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Text Block */}
          <div className="lg:col-span-5 reveal flex flex-col items-start text-left">
            <h2 className="text-[#12131A] font-extrabold text-4xl mb-4 leading-tight">Campus Reach</h2>
            <p className="text-[#6B7280] text-base leading-relaxed mb-6 max-w-md">
              Wamdh is used by university students and educators globally to streamline studying, review spacing, and track academic metrics.
            </p>
          </div>

          {/* Right: Layered Organic Blobs and White Logos */}
          <div className="lg:col-span-7 reveal relative flex justify-center items-center h-[340px] md:h-[400px]">
            {/* Back Pink Blob */}
            <div 
              className="absolute w-[95%] h-[95%] bg-[#FF8E9C]/90 animate-blob pointer-events-none opacity-90"
              style={{
                borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
                animationDuration: "12s"
              }}
            />
            {/* Front Blue Blob */}
            <div 
              className="absolute w-[90%] h-[90%] bg-[#2547F4] animate-blob shadow-2xl flex items-center justify-center p-6 md:p-12 text-white"
              style={{
                borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                animationDuration: "8s"
              }}
            >
              {/* White client logos layout */}
              <div className="grid grid-cols-3 gap-6 md:gap-8 justify-items-center items-center w-full z-10">
                {[
                  "Stanford University", "MIT", "Oxford University", 
                  "Harvard College", "Cambridge Univ.", "Cairo University", 
                  "KSU", "UCLA", "Univ. of Toronto"
                ].map((logo, idx) => (
                  <div 
                    key={idx} 
                    className="text-white font-extrabold text-[12px] md:text-sm tracking-wider hover:scale-105 transition-all text-center select-none opacity-95 hover:opacity-100"
                  >
                    {logo}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          TESTIMONIALS (Grid, Floating Avatars, Interactive Card)
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-12 bg-[#F7F8FB] overflow-hidden relative">
        {/* Background Grid Lines (100px square grid pattern) */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to right, #12131A 1px, transparent 1px), linear-gradient(to bottom, #12131A 1px, transparent 1px)",
            backgroundSize: "100px 100px"
          }}
        />

        <div className="max-w-[1280px] mx-auto text-center relative z-10">
          <h2 className="text-[#12131A] font-extrabold text-4xl mb-4 reveal">Testimonials</h2>
          <p className="text-[#6B7280] text-base max-w-lg mx-auto mb-16 reveal delay-100">
            Hear how students are accelerating their learning schedules and grades with Wamdh.
          </p>

          {/* Testimonials interactive area */}
          <div className="relative min-h-[460px] flex items-center justify-center">
            
            {/* 6 Floating circular avatars (Clickable) */}
            {[
              { idx: 0, initial: "N", name: "Nathan Roberts", x: "left-[10%] top-[10%]", size: "w-16 h-16 text-lg" },
              { idx: 1, initial: "S", name: "Sarah Taylor", x: "left-[22%] top-[45%]", size: "w-12 h-12 text-sm" },
              { idx: 2, initial: "J", name: "James Anderson", x: "left-[8%] top-[70%]", size: "w-14 h-14 text-base" },
              { idx: 3, initial: "M", name: "Michael Brown", x: "right-[12%] top-[12%]", size: "w-14 h-14 text-base" },
              { idx: 4, initial: "E", name: "Emily Johnson", x: "right-[20%] top-[40%]", size: "w-16 h-16 text-lg" },
              { idx: 5, initial: "A", name: "Ahmad Rashid", x: "right-[8%] top-[68%]", size: "w-12 h-12 text-sm" }
            ].map((avatar) => (
              <button
                key={avatar.idx}
                onClick={() => setTestimonialIdx(avatar.idx)}
                className={`absolute rounded-full border-2 transition-all duration-300 shadow-md flex items-center justify-center font-bold ${avatar.x} ${avatar.size} ${
                  testimonialIdx === avatar.idx 
                    ? "bg-[#2547F4] text-white border-white scale-110 z-20 shadow-xl" 
                    : "bg-white text-[#2547F4] border-transparent hover:border-[#2547F4]/40 hover:scale-105"
                }`}
                title={avatar.name}
              >
                {avatar.initial}
              </button>
            ))}

            {/* Foreground Central Card */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#E7E9F0] shadow-card max-w-[580px] w-full mx-auto relative z-10 transition-all duration-500 hover:shadow-xl">
              
              {/* Central avatar in border */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-[#2547F4]/30 flex items-center justify-center text-xl font-bold text-[#2547F4] mb-3">
                  {testimonials[testimonialIdx].name[0]}
                </div>
                <h5 className="text-[#12131A] font-extrabold text-base leading-tight">{testimonials[testimonialIdx].name}</h5>
                <p className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mt-0.5">{testimonials[testimonialIdx].role}</p>
              </div>

              {/* Quote Heading & Text */}
              <div className="text-center transition-opacity duration-300">
                <h4 className="text-[#12131A] font-extrabold text-lg mb-4">
                  {testimonials[testimonialIdx].title}
                </h4>
                <p className="text-[#6B7280] text-sm md:text-base leading-relaxed">
                  "{testimonials[testimonialIdx].text}"
                </p>
              </div>

              {/* Carousel dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestimonialIdx(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === testimonialIdx ? "bg-[#2547F4] w-5" : "bg-gray-300 hover:bg-gray-400"}`}
                  />
                ))}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PRICING SECTION
      ════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-[#12131A] font-extrabold text-4xl mb-4 reveal">Transparent Pricing Plans</h2>
          <p className="text-[#6B7280] text-base max-w-lg mx-auto mb-16 reveal delay-100">
            No paywalls. No hidden fees. Just complete learning tools.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto reveal delay-200">
            {[
              { name: "Standard Plan", price: "$0", desc: "Complete access to the platform utilities.", features: ["Unlimited OCR note processing", "AI summaries & chat conversations", "Unlimited quizzes & cards", "Full planner & calendars"], highlight: true },
            ].map((p, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-[#E7E9F0] shadow-card flex flex-col justify-between relative hover:shadow-lg transition-all duration-300 ring-2 ring-[#2547F4] col-start-2"
              >
                <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#2547F4] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Free Forever
                </span>
                <div>
                  <h4 className="text-[#12131A] font-extrabold text-lg mb-2">{p.name}</h4>
                  <div className="flex items-baseline justify-center gap-1 my-4">
                    <span className="text-[#12131A] font-black text-4xl">{p.price}</span>
                    <span className="text-[#6B7280] text-sm">/forever</span>
                  </div>
                  <p className="text-[#6B7280] text-xs mb-6">{p.desc}</p>
                  <hr className="border-[#E7E9F0] mb-6" />
                  <ul className="text-left space-y-3">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="text-[#6B7280] text-sm flex items-center gap-2">
                        <span className="text-[#2547F4]">✔</span> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest mt-8 transition-all bg-[#2547F4] text-white hover:bg-[#1B35C4]"
                >
                  Start Studying
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FAQ SECTION
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-12 bg-[#F7F8FB]">
        <div className="max-w-[720px] mx-auto text-center">
          <h2 className="text-[#12131A] font-extrabold text-4xl mb-12 reveal">FAQ's</h2>

          <div className="space-y-4 text-left reveal delay-100">
            {[
              { q: "What is Wamdh?", a: "Wamdh is a unified AI study platform combining OCR note ingestion, context-grounded AI chat tutoring, spaced repetition flashcards, quizzes, and automated planner scheduling." },
              { q: "How does the AI Chat Tutor work?", a: "The AI Chat Tutor ('Mona') uses retrieval-augmented generation (RAG) to scan and reference your notes locally, ensuring responses are completely grounded in your syllabus." },
              { q: "Is the app completely free?", a: "Yes, our Standard Plan is free forever and unlocks all primary features including unlimited OCR note scanning, summaries, study planners, and flashcards." },
              { q: "Is it available on Android and iOS?", a: "Yes! A standalone APK is available for direct installation on Android, and iOS beta previews are available through Apple TestFlight." }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E7E9F0] rounded-2xl p-5 cursor-pointer hover:border-[#2547F4]/30 transition-all"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[#12131A] font-extrabold text-[15px]">{faq.q}</span>
                  <span className={`text-xl font-bold transition-all ${openFaq === idx ? "rotate-45 text-[#2547F4]" : "text-gray-400"}`}>+</span>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? "max-h-40 mt-3 pt-3 border-t border-gray-100" : "max-h-0"}`}>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          DOWNLOAD APP (Secondary CTA)
      ════════════════════════════════════════════════════════════════════ */}
      <section id="download" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column */}
          <div className="reveal flex flex-col items-start">
            <h2 className="text-[#12131A] font-extrabold text-4xl mb-6 leading-tight">
              Download App
            </h2>
            <p className="text-[#6B7280] text-base leading-relaxed mb-8 max-w-md">
              Take your study environment with you. Scan notes, practice flashcards, and coordinate schedules on your mobile device.
            </p>
            
            {/* Store Buttons */}
            <div className="flex flex-wrap gap-3 mb-8 w-full">
              <button onClick={handleDownload} className="store-btn dark bg-black border-transparent text-white">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <span className="block text-[9px] text-white/50 uppercase leading-none">Download on the</span>
                  <span className="font-bold text-sm">App Store</span>
                </div>
              </button>
              <button onClick={handleDownload} className="store-btn dark bg-black border-transparent text-white">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.18l12.6-7.27-2.54-2.54-11.05 9.63zm-1.59-20.4A1.5 1.5 0 001.5 4.5v15a1.5 1.5 0 00.09.54l11.43-9.97L1.59 3.36zm19.41 8.49l-2.79-1.61-2.85 2.49 2.85 2.49 2.82-1.62c.8-.46.8-1.29-.03-1.75zM4.17.06L16.77 7.33l-2.54 2.54L3.18.24A1.5 1.5 0 004.17.06z"/>
                </svg>
                <div className="text-left">
                  <span className="block text-[9px] text-white/50 uppercase leading-none">Get it on</span>
                  <span className="font-bold text-sm">Google Play</span>
                </div>
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="bg-[#2547F4] hover:bg-[#1B35C4] text-white px-8 py-3.5 rounded-full text-[14px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20"
            >
              Get Standalone APK Package
            </button>
          </div>

          {/* Right Column: Phone Mockup with Dotted Grid Behind */}
          <div className="reveal relative flex justify-center items-center delay-200">
            {/* Dotted grid design */}
            <div className="absolute left-[10%] top-[10%] opacity-15 pointer-events-none w-48 h-48 grid grid-cols-6 gap-2">
              {[...Array(36)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#12131A]" />
              ))}
            </div>
            <PhoneMockup activeScreen="flashcards" />
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER (Navy Background, Outline Blobs, Large CTA)
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0E1526] text-white pt-24 pb-12 px-6 md:px-12 relative overflow-hidden">
        {/* Floating Neon Outlines/Shapes in Corners */}
        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 border-4 border-dashed border-[#2547F4]/20 rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute top-[20%] right-[-80px] w-64 h-64 border-4 border-double border-[#6C63FF]/15 rounded-full animate-float pointer-events-none" />

        <div className="max-w-[1280px] mx-auto relative z-10">
          
          {/* Upper Section: Large CTA Banner */}
          <div className="text-center pb-20 border-b border-white/10 flex flex-col items-center">
            <h2 className="text-white font-extrabold text-4xl md:text-5xl mb-8 tracking-tight">
              Start Mastering Your Studies!
            </h2>
            
            {/* CTA Button with Accent lines */}
            <div className="relative group">
              {/* Hand-drawn accent indicators (decorative side dashes) */}
              <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-[#FF6B57] font-black text-xl select-none animate-pulse">彡</div>
              <button 
                onClick={handleDownload}
                className="bg-[#2547F4] hover:bg-[#1B35C4] text-white px-10 py-4 rounded-full text-base font-extrabold transition-all duration-300 shadow-xl group-hover:scale-105"
              >
                Try Wamdh Now &gt;
              </button>
              <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-[#FF6B57] font-black text-xl select-none animate-pulse">ミ</div>
            </div>
          </div>

          {/* Middle Section: Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 py-16">
            
            {/* Col 1: Brand block (Left, width ~35%) */}
            <div className="md:col-span-4 flex flex-col items-start text-left">
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-6 h-6 text-[#2547F4]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-extrabold text-lg tracking-tight text-white">Wamdh</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                ❤️ Empowering students to build their dream future with next-generation AI revision tools.
              </p>
              
              {/* Product Hunt Badge & All Systems Operational Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-[#12131A] text-white border border-[#E7E9F0]/10 rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold shadow-md hover:border-[#2547F4]/30 cursor-pointer select-none transition-all">
                  <span className="text-amber-500">🏆</span>
                  <span>PRODUCT HUNT</span>
                  <span className="text-gray-400 font-normal">#1 Product of the Week</span>
                </div>
                <div className="bg-[#12131A] text-emerald-400 border border-emerald-500/20 rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold shadow-md select-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            {/* Col 2: General */}
            <div className="md:col-span-2 text-left">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#2547F4] mb-5">General</h4>
              <ul className="space-y-3 text-sm">
                {["About Wamdh", "Public Roadmap", "Changelog", "Affiliate Program"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="md:col-span-2 text-left">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#2547F4] mb-5">Resources</h4>
              <ul className="space-y-3 text-sm">
                {["Documentation", "Tutorial Videos", "Community", "Wamdh Blog", "Free Illustrations", "Partners"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Follow Us */}
            <div className="md:col-span-2 text-left">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#2547F4] mb-5">Follow Us</h4>
              <ul className="space-y-3 text-sm">
                {["Twitter", "LinkedIn", "Facebook", "Discord", "Instagram", "TikTok"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 5: Partner Program */}
            <div className="md:col-span-2 text-left">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[#2547F4] mb-5">Partner</h4>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                Earn up to 40% recurring commission.
              </p>
              <a href="#" className="text-[#FF6B57] hover:text-[#FF8E9C] text-xs font-bold flex items-center gap-1.5 transition-colors">
                Become a Partner <span>→</span>
              </a>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© 2026 Wamdh, Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-all">Terms & Conditions</a>
              <a href="#" className="hover:text-white transition-all">Privacy Policy</a>
            </div>
          </div>

        </div>

        {/* Floating Chat Widget in Bottom Right corner */}
        <div className="fixed bottom-6 right-6 z-50 animate-float">
          <button 
            onClick={handleDownload}
            className="w-14 h-14 rounded-full bg-[#2547F4] hover:bg-[#1B35C4] text-white flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:rotate-12 hover:scale-110"
            title="Chat Support"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </footer>

      {/* ─── Add CSS to handle page-scroll reveals & custom fade-ins ─── */}
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .spin-slow {
          animation: spin 30s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .store-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 8px 16px;
          color: white;
          transition: all 0.2s ease;
        }
        .store-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        .store-btn.dark {
          background: #000000;
          border: 1px solid #1A1A2E;
        }
        .store-btn.dark:hover {
          background: #11111E;
        }
      `}</style>

    </div>
  );
}