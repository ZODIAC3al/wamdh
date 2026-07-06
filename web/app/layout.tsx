import "./globals.css";
import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Wamdh - AI Study OS",
  description: "Your AI-powered learning operating system. Generate notes summaries, quizzes, and spaced repetition cards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans bg-[#F4F4F8] antialiased">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
              وََمْض <span className="text-[#7C3AED] text-lg font-medium">Wamdh</span>
            </Link>
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-[#6B7280]">
              <Link href="/" className="hover:text-[#7C3AED] transition-colors">Home</Link>
              <Link href="/features" className="hover:text-[#7C3AED] transition-colors">Features</Link>
              <Link href="/pricing" className="hover:text-[#7C3AED] transition-colors">Pricing</Link>
              <Link href="/download" className="hover:text-[#7C3AED] transition-colors">Download</Link>
            </nav>
            <Link
              href="/download"
              className="bg-[#1A1A2E] text-white hover:bg-[#7C3AED] px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm"
            >
              Get App
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Footer */}
        <footer className="w-full bg-[#1A1A2E] text-white py-12 px-6 border-t border-gray-800">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-xl font-bold">وََمْض</p>
              <p className="text-xs text-gray-400 mt-1">© 2026 Wamdh AI. All rights reserved.</p>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="/" className="hover:text-white">Privacy Policy</Link>
              <Link href="/" className="hover:text-white">Terms of Service</Link>
              <Link href="/download" className="hover:text-white">Expo Go Preview</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
