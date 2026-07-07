import "./globals.css";
import React from "react";

export const metadata = {
  title: "Wamdh – Smart Home Control Application",
  description: "Manage energy, automate heating, control your lights, and keep your home secure with a single, easy-to-use application.",
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
