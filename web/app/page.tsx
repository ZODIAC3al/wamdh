"use client";

import React, { useState, useEffect } from "react";

/* ─── Shared Components: PhoneMockup ───────────────────────────────────────── */
interface PhoneMockupProps {
  activeScreen: "energy" | "temperature" | "room";
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

        {/* ─── Screen: Energy ─── */}
        {activeScreen === "energy" && (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Energy Saving</p>
                <h4 className="text-sm font-extrabold text-white">Live statistics</h4>
              </div>
              <span className="bg-[#2547F4]/20 text-[#2547F4] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#2547F4]/30">Active</span>
            </div>

            {/* Circular Ring Chart */}
            <div className="relative flex justify-center items-center my-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="50" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="transparent" />
                <circle cx="64" cy="64" r="50" stroke="#FF6B57" strokeWidth="8" fill="transparent" strokeDasharray="314" strokeDashoffset="80" strokeLinecap="round" />
                <circle cx="64" cy="64" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" />
                <circle cx="64" cy="64" r="40" stroke="#22C1DC" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset="90" strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <p className="text-xl font-extrabold text-white">256</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Total kWh</p>
              </div>
            </div>

            {/* Device Shortcut Icons */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              {[
                { name: "Smart Light", status: "On", color: "from-[#FF6B57]/20 to-[#FF6B57]/5", icon: "💡", accent: "text-[#FF6B57]" },
                { name: "Air Cond.", status: "Off", color: "from-[#22C1DC]/20 to-[#22C1DC]/5", icon: "❄️", accent: "text-[#22C1DC]" },
                { name: "Smart TV", status: "On", color: "from-[#6C63FF]/20 to-[#6C63FF]/5", icon: "📺", accent: "text-[#6C63FF]" },
                { name: "Home Heater", status: "Off", color: "from-white/10 to-white/5", icon: "🔥", accent: "text-gray-400" },
              ].map((item, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${item.color} border border-white/5 rounded-2xl p-3 flex flex-col justify-between h-20`}>
                  <div className="flex justify-between items-start">
                    <span className="text-lg">{item.icon}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${item.status === "On" ? "text-emerald-400" : "text-gray-500"}`}>{item.status}</span>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-extrabold text-white">{item.name}</h5>
                    <p className={`text-[8px] ${item.accent} font-semibold`}>Control App</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Screen: Temperature ─── */}
        {activeScreen === "temperature" && (
          <div className="flex-1 flex flex-col p-4 justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Living Room</p>
              <h4 className="text-sm font-extrabold text-white">Temperature control</h4>
            </div>

            {/* Mode Selectors */}
            <div className="flex justify-around bg-white/5 rounded-xl p-1.5 my-2">
              {["☀️", "❄️", "💧", "🌪️"].map((m, i) => (
                <button key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${i === 1 ? "bg-[#2547F4] text-white" : "text-gray-400 hover:text-white"}`}>
                  {m}
                </button>
              ))}
            </div>

            {/* Temperature Dial */}
            <div className="relative flex justify-center items-center my-2">
              <div className="w-36 h-36 rounded-full border-4 border-[#2547F4]/40 flex items-center justify-center bg-[#1E2538]/50 shadow-inner relative">
                {/* Dial Tick marks */}
                <div className="absolute inset-2 rounded-full border border-dashed border-white/10 spin-slow" />
                <div className="text-center z-10">
                  <p className="text-3xl font-black text-white">27°C</p>
                  <p className="text-[9px] text-[#22C1DC] font-extrabold uppercase tracking-widest mt-0.5">Cooling Mode</p>
                </div>
                {/* Circular Adjuster Knob */}
                <div className="absolute top-2 w-4 h-4 bg-white rounded-full border-2 border-[#2547F4] shadow-md cursor-pointer" />
              </div>
            </div>

            {/* Weekly Bar Chart */}
            <div className="bg-white/5 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Weekly Usage</span>
                <span className="text-[9px] text-emerald-400 font-extrabold">-12% this week</span>
              </div>
              <div className="flex justify-between items-end h-16 pt-2">
                {[30, 45, 60, 35, 75, 50, 40].map((h, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div className={`w-2.5 rounded-t-sm w-full transition-all duration-300`} style={{ height: `${h}%`, background: i === 4 ? "#FF6B57" : "#2547F4" }} />
                    <span className="text-[8px] text-gray-500 mt-1 font-bold">{"SMTWTFS"[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Screen: Room ─── */}
        {activeScreen === "room" && (
          <div className="flex-1 flex flex-col p-4 justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Smart System</p>
              <h4 className="text-sm font-extrabold text-white">My Bedroom devices</h4>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 my-2">
              {["All", "Light", "AC", "TV"].map((t, i) => (
                <span key={i} className={`text-[9px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all ${i === 0 ? "bg-[#2547F4] text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                  {t}
                </span>
              ))}
            </div>

            {/* iOS style device switches */}
            <div className="flex-1 flex flex-col gap-2 my-2 overflow-y-auto max-h-[220px] scrollbar-thin">
              {[
                { name: "Main Chandelier", state: true, type: "Light", icon: "💡" },
                { name: "Room Air Conditioner", state: true, type: "AC", icon: "❄️" },
                { name: "Samsung Smart TV", state: false, type: "TV", icon: "📺" },
                { name: "Nightstand Lamp", state: true, type: "Light", icon: "💡" },
              ].map((dev, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{dev.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-white leading-tight">{dev.name}</p>
                      <p className="text-[8px] text-gray-500">{dev.type}</p>
                    </div>
                  </div>
                  {/* Switch */}
                  <div className={`w-8 h-4 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 ${dev.state ? "bg-[#2547F4]" : "bg-white/10"}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full transition-all duration-300 ${dev.state ? "translate-x-4" : ""}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* SAVE Button */}
            <button className="w-full bg-[#2547F4] hover:bg-[#1B35C4] py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 mt-2">
              Save configuration
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    // Explicit SDK download link
    window.location.href = "/downloads/wamdh.apk";
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F8FB] overflow-x-hidden font-sans">
      
      {/* ════════════════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#2547F4]/90 backdrop-blur-md border-b border-white/10 py-4 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          
          {/* Logo (House icon + Wamdh wordmark) */}
          <div className="flex items-center gap-2 cursor-pointer">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
            <a href="#login" className="text-white/80 hover:text-white font-medium text-[15px] transition-colors">
              Login
            </a>
            <button
              onClick={handleDownload}
              className="bg-white text-[#2547F4] hover:bg-[#E4E9FF] px-6 py-2.5 rounded-full text-[14px] font-bold tracking-wide transition-all shadow-md"
            >
              Sign up
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
              Wamdh Application
            </h1>
            <p className="text-[#E4E9FF] text-base md:text-lg max-w-xl leading-relaxed mb-8 animate-fade-in-up delay-100">
              Manage energy, automate heating, control your lights, and keep your home secure with a single, easy-to-use application. Try it today.
            </p>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 mb-8 w-full animate-fade-in-up delay-200">
              <button
                onClick={handleDownload}
                className="bg-white text-[#2547F4] hover:bg-[#1B35C4] hover:text-white px-8 py-3.5 rounded-full text-[15px] font-extrabold transition-all shadow-xl hover:-translate-y-0.5"
              >
                Get Started
              </button>
              <button className="flex items-center gap-2 text-white font-bold hover:text-[#E4E9FF] transition-all group">
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

            {/* Left Phone: Energy */}
            <div className="absolute left-[5%] bottom-0 transform -rotate-6 scale-[0.85] opacity-80 hover:opacity-100 transition-all duration-300 z-10">
              <PhoneMockup activeScreen="energy" />
            </div>

            {/* Center Phone (Raised, Larger, Shadow) */}
            <div className="absolute z-20 shadow-2xl hover:scale-105 transition-all duration-300">
              <PhoneMockup activeScreen="temperature" />
            </div>

            {/* Right Phone: Room Devices */}
            <div className="absolute right-[5%] bottom-0 transform rotate-6 scale-[0.85] opacity-80 hover:opacity-100 transition-all duration-300 z-10">
              <PhoneMockup activeScreen="room" />
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
            <span className="text-[#2547F4] text-[14px] font-bold uppercase tracking-widest mb-4">About us</span>
            <h2 className="text-[#12131A] font-extrabold text-4xl mb-6 leading-tight">
              Wamdh's Smart Services
            </h2>
            <p className="text-[#6B7280] text-base leading-relaxed mb-8 max-w-xl">
              Experience seamless, intuitive control over your ecosystem. Our app auto-detects lighting, climate controls, security sensors, and media centers. Enjoy intelligent scheduling and responsive diagnostics.
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
            <PhoneMockup activeScreen="temperature" />

            {/* 4 Floating Badges */}
            <div className="absolute top-[10%] left-[10%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float">
              💡
            </div>
            <div className="absolute top-[15%] right-[10%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float-slow">
              ❄️
            </div>
            <div className="absolute bottom-[20%] left-[5%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float-slow">
              🔒
            </div>
            <div className="absolute bottom-[15%] right-[5%] w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-lg animate-float">
              🖥️
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          OUR CLIENTS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-12 bg-white border-t border-b border-[#E7E9F0]">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-[#12131A] font-extrabold text-3xl mb-3 reveal">Our Clients</h2>
          <p className="text-[#6B7280] text-sm max-w-md mx-auto mb-12 reveal delay-100">
            Trusted by the world's most innovative home builders and smart device creators.
          </p>

          {/* Logo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center items-center reveal delay-200">
            {[
              "logo-logipsum", "logo-coticaz", "logo-aquatune", "logo-goldon",
              "logo-entaol", "logo-cotieaz", "logo-morlino", "logo-proline"
            ].map((logo, idx) => (
              <div key={idx} className="text-gray-400 font-extrabold text-lg tracking-wider opacity-60 hover:opacity-100 transition-all uppercase select-none">
                {logo.replace("logo-", "")}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 md:px-12 bg-[#F7F8FB]">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-[#12131A] font-extrabold text-4xl mb-4 reveal">Testimonials</h2>
          <p className="text-[#6B7280] text-base max-w-lg mx-auto mb-16 reveal delay-100">
            Hear from homeowners who upgraded to the premium smartHome environment.
          </p>

          {/* 2x2 grid of testimonial cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left reveal delay-200">
            {[
              {
                text: "The integration works perfectly. The custom schedules allowed us to trim our energy bills by nearly 20% in the first winter.",
                name: "Sarah Taylor", role: "Product Designer"
              },
              {
                text: "Highly intuitive layout! Configuring bedroom presets is incredibly fast, and the smart schedules work seamlessly in the background.",
                name: "James Anderson", role: "UI/UX Engineer"
              },
              {
                text: "The temperature controller is incredibly responsive. Excellent device alerts and direct feedback for diagnostic warnings.",
                name: "Michael Brown", role: "Developer"
              },
              {
                text: "Outstanding design aesthetics and support features. Recommended for all smart-home enthusiasts looking for direct setup.",
                name: "Emily Johnson", role: "Marketing Specialist"
              }
            ].map((test, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border border-[#E7E9F0] shadow-card flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <span className="text-6xl text-[#2547F4]/20 leading-none font-serif select-none">“</span>
                  <p className="text-[#6B7280] text-base leading-relaxed mb-6 -mt-4">{test.text}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-gray-100 flex items-center justify-center text-sm font-bold text-[#2547F4]">
                    {test.name[0]}
                  </div>
                  <div>
                    <h5 className="text-[#12131A] font-extrabold text-sm leading-tight">{test.name}</h5>
                    <p className="text-[#6B7280] text-xs font-semibold">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel dots */}
          <div className="flex justify-center gap-2 mt-12">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${dot === 0 ? "bg-[#2547F4]" : "bg-gray-300"}`} />
            ))}
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
            Choose the package that matches your home layout. Start free, upgrade anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto reveal delay-200">
            {[
              { name: "Lite", price: "$0", desc: "Perfect for single room setups.", features: ["Control up to 4 devices", "Basic energy stats", "Single-user access"] },
              { name: "Standard", price: "$19", desc: "For typical apartments and apartments.", features: ["Control up to 15 devices", "Weekly usage graphs", "Multi-user access", "Email Support"], highlight: true },
              { name: "Premium", price: "$49", desc: "Full automation for modern villas.", features: ["Unlimited devices", "Advanced diagnostics", "Voice Assistant Sync", "24/7 Priority Support"] },
            ].map((p, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-8 border border-[#E7E9F0] shadow-card flex flex-col justify-between relative hover:shadow-lg transition-all duration-300 ${p.highlight ? "ring-2 ring-[#2547F4]" : ""}`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#2547F4] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                )}
                <div>
                  <h4 className="text-[#12131A] font-extrabold text-lg mb-2">{p.name}</h4>
                  <div className="flex items-baseline justify-center gap-1 my-4">
                    <span className="text-[#12131A] font-black text-4xl">{p.price}</span>
                    <span className="text-[#6B7280] text-sm">/month</span>
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
                  className={`w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest mt-8 transition-all ${p.highlight ? "bg-[#2547F4] text-white hover:bg-[#1B35C4]" : "bg-gray-100 text-[#12131A] hover:bg-gray-200"}`}
                >
                  Activate Plan
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
              { q: "What is Wamdh app?", a: "Wamdh is a unified control client designed to consolidate configuration profiles, light fixtures, climate regulators, and safety appliances into a single intuitive app dashboard." },
              { q: "How do I connect my devices?", a: "Our system runs on-device autodiscovery using multicast UDP/DNS. Make sure all devices are logged to your primary local router network." },
              { q: "Is the app compatible with all devices?", a: "Yes, our engine integrates with Zigbee, Z-Wave, Matter, HomeKit, and major hardware standards." },
              { q: "Is my data safe with Wamdh app?", a: "All communication keys remain encrypted locally. Usage metrics do not leave your home ecosystem without user consent." }
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
              Control your smart home environment directly on your device. Click the button below to get the official release APK packages.
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
              Download direct SDK / APK Package
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
            <PhoneMockup activeScreen="temperature" />
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER (Navy Background)
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0E1526] text-white pt-20 pb-10 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Col 1: Logo & Info */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-6 h-6 text-[#2547F4]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-extrabold text-lg tracking-tight text-white">Wamdh</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Recreate the ultimate smart home environment with modern SaaS and mobile app controls under Wamdh.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {["Home", "Features", "Pricing", "Download"].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase()}`} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5">Support</h4>
            <ul className="space-y-3">
              {["Help Center", "Terms of Service", "Privacy Policy", "Contact Us"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Follow Us */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5">Follow Us</h4>
            <div className="flex gap-3">
              {["fb", "tw", "in", "ig"].map((soc) => (
                <a
                  key={soc}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold hover:bg-[#2547F4] hover:border-transparent transition-all"
                >
                  {soc.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="max-w-[1280px] mx-auto pt-8 border-t border-white/10 text-center text-gray-500 text-xs">
          <p>© 2026 Wamdh. All rights reserved.</p>
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