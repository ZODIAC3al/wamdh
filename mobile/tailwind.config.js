module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#BE1A1A",
        "primary-light": "#D0311E",
        "primary-soft": "#F8EBAB",
        surface: "#1A1A2E",
        background: "#111827",
        "gray-text": "#9CA3AF",
        success: "#10B981",
        error: "#EF4444",
        warning: "#F7D87F",
        dark: {
          bg: "#111827",
          surface: "#1A1A2E",
          card: "#252540",
          border: "#2E2E50",
        },
        light: {
          bg: "#F4F4F8",
          surface: "#FFFFFF",
          card: "#F9FAFB",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        display: ["Sora_700Bold"],
        body: ["Inter_400Regular"],
        "body-medium": ["Inter_500Medium"],
        "body-bold": ["Inter_700Bold"],
        mono: ["JetBrainsMono_400Regular"],
      },
      borderRadius: {
        card: "16px",
        input: "12px",
        pill: "50px",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
