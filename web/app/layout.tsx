import "./globals.css";
import React from "react";

export const metadata = {
  title: "Wamdh – AI-Powered Study Operating System",
  description: "Wamdh is a comprehensive AI study platform combining OCR note ingestion, interactive AI tutoring, spaced repetition flashcards, quizzes, and automated planner scheduling.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F8FB] antialiased">
        {children}
      </body>
    </html>
  );
}
