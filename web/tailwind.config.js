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
        primary: "#7C3AED",
        "primary-light": "#A78BFA",
        "primary-soft": "#EDE9FE",
        surface: "#FFFFFF",
        background: "#F4F4F8",
        "gray-text": "#6B7280",
        success: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
        dark: {
          bg: "#0F0F1A",
          surface: "#1A1A2E",
          card: "#252540",
          border: "#2E2E50",
        },
      },
    },
  },
  plugins: [],
};
