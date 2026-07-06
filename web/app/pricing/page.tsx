import React from "react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-[85vh] bg-[#F4F4F8] flex flex-col justify-center py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-[#1A1A2E] tracking-tight mb-4">
          Simple, Fair Pricing
        </h1>
        <p className="text-[#6B7280] text-lg mb-16 max-w-md mx-auto">
          No paywalls. No hidden fees. Just complete learning tools.
        </p>

        <div className="bg-white border-2 border-[#7C3AED] rounded-2xl p-10 max-w-md mx-auto shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#7C3AED] text-white text-[10px] font-bold px-4 py-1 rounded-bl-lg uppercase tracking-wider">
            Free Forever
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Standard Plan</h2>
          <p className="text-sm text-[#6B7280] mb-6">Complete access to the platform utilities.</p>
          <div className="text-4xl font-extrabold text-[#1A1A2E] mb-8">$0</div>
          
          <ul className="text-left text-sm text-[#6B7280] space-y-4 mb-8">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> Unlimited OCR note processing
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> AI summarizes & chat conversations
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> Unlimited quizzes & spaced repetition cards
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> Full Study Planner calendars
            </li>
          </ul>

          <Link
            href="/download"
            className="block w-full bg-[#7C3AED] hover:bg-[#1A1A2E] text-white text-center py-3.5 rounded-full font-bold transition-all text-sm"
          >
            Start Studying Now
          </Link>
        </div>
      </div>
    </main>
  );
}
