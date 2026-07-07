/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2547F4",
        "primary-dark": "#1B35C4",
        navy: "#0E1526",
        "bg-light": "#F7F8FB",
        "bg-white": "#FFFFFF",
        "text-dark": "#12131A",
        "text-muted": "#6B7280",
        "text-on-blue": "#E4E9FF",
        "accent-orange": "#FF6B57",
        "accent-teal": "#22C1DC",
        "accent-purple": "#6C63FF",
        "border-light": "#E7E9F0",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        phone: "36px",
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.06)",
        phone: "0 40px 80px rgba(0,0,0,0.6)",
      }
    },
  },
  plugins: [],
};
