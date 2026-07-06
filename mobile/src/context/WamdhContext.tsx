import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useLanguageStore, Locale } from "../lib/i18n";
import { queryClient } from "../lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

// Define the theme tokens structure
export interface ThemeColors {
  // Core surfaces
  background: string;
  cardBg: string;
  border: string;
  inputBg: string;
  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  // Brand accent
  accent: string;
  accentLight: string;
  accentMuted: string;
  // Semantic colors
  danger: string;
  dangerMuted: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  info: string;
  infoMuted: string;
  // Surface variants
  surfaceElevated: string;
  overlay: string;
  // Component tokens
  tabBarBg: string;
  statusBarStyle: "light-content" | "dark-content";
  // UI/UX Overhaul additions
  brandPrimary: string;
  brandGold: string;
  glassSurface: string;
  limeAccent: string;
}

// Light theme color palette
const LIGHT_COLORS: ThemeColors = {
  background: "#FAF8F5",
  cardBg: "#FFFFFF",
  border: "#ECE7E1",
  inputBg: "#F3EFE9",
  textPrimary: "#15120F",
  textSecondary: "#7A6F63",
  accent: "#262626",
  accentLight: "#404040",
  accentMuted: "rgba(38, 38, 38, 0.08)",
  // Semantic
  danger: "#EF4444",
  dangerMuted: "rgba(239, 68, 68, 0.10)",
  success: "#10B981",
  successMuted: "rgba(16, 185, 129, 0.10)",
  warning: "#F59E0B",
  warningMuted: "rgba(245, 158, 11, 0.10)",
  info: "#3B82F6",
  infoMuted: "rgba(59, 130, 246, 0.10)",
  // Surface variants
  surfaceElevated: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.40)",
  // Component
  tabBarBg: "#FFFFFF",
  statusBarStyle: "dark-content",
  // UI/UX Overhaul
  brandPrimary: "#BE1A1A",
  brandGold: "#F2A93B",
  glassSurface: "rgba(255,255,255,0.62)",
  limeAccent: "#D4FC34",
};

// Dark theme color palette
const DARK_COLORS: ThemeColors = {
  background: "#0E0C0A",
  cardBg: "#1A1714",
  border: "#2A2520",
  inputBg: "#1A1714",
  textPrimary: "#FAF8F5",
  textSecondary: "#7A6F63",
  accent: "#FAF8F5",
  accentLight: "#D4D4D4",
  accentMuted: "rgba(250, 250, 250, 0.12)",
  // Semantic
  danger: "#EF4444",
  dangerMuted: "rgba(239, 68, 68, 0.15)",
  success: "#10B981",
  successMuted: "rgba(16, 185, 129, 0.15)",
  warning: "#F59E0B",
  warningMuted: "rgba(245, 158, 11, 0.15)",
  info: "#3B82F6",
  infoMuted: "rgba(59, 130, 246, 0.15)",
  // Surface variants
  surfaceElevated: "#1A1714",
  overlay: "rgba(0, 0, 0, 0.60)",
  // Component
  tabBarBg: "#1A1714",
  statusBarStyle: "light-content",
  // UI/UX Overhaul
  brandPrimary: "#BE1A1A",
  brandGold: "#F2A93B",
  glassSurface: "rgba(26,23,20,0.66)",
  limeAccent: "#D4FC34",
};

// Important App Data Context Structure
interface WamdhContextProps {
  colors: ThemeColors;
  isDark: boolean;
  locale: Locale;
  isRtl: boolean;
  t: (key: any) => string;
  setLocale: (locale: Locale) => void;
  user: any;
  logout: () => Promise<void>;
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  accentColor: string | null;
  setAccentColor: (color: string | null) => void;
  refreshUser: () => void;
  updateUserField: (fields: Record<string, any>) => Promise<void>;
}

const WamdhContext = createContext<WamdhContextProps | undefined>(undefined);

export function WamdhProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { user, logout, updateUserField } = useAuthStore();
  const { mode: themeMode, setMode: setThemeStoreMode, accentColor, setAccentColor } = useThemeStore();
  const { locale, setLocale, t } = useLanguageStore();

  const [activeColors, setActiveColors] = useState<ThemeColors>(LIGHT_COLORS);
  const [isDark, setIsDark] = useState(false);

  // Fetch owned store inventory
  const { data: storeInventory } = useQuery({
    queryKey: ["store-catalog"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/api/payments/store/catalog/");
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const ownedNonConsumables = storeInventory?.owned_non_consumables || [];

  // Register simulated push token on successful user authentication
  useEffect(() => {
    if (user) {
      apiClient.post("/api/users/notifications/register/", {
        token: `ExponentPushToken[mock_token_${user.id || "default"}]`
      }).catch(err => {
        console.log("Failed to register simulated push token:", err);
      });
    }
  }, [user]);

  // Compute theme colors dynamically based on user setting or system setting
  useEffect(() => {
    const darkActive =
      themeMode === "system"
        ? systemScheme === "dark"
        : themeMode === "dark";

    setIsDark(darkActive);
    
    // Base palette
    const baseColors = { ...(darkActive ? DARK_COLORS : LIGHT_COLORS) };

    // Apply custom accent override if user customized it
    if (accentColor) {
      let validatedAccent: string | null = accentColor;
      
      // Enforce premium theme lock verification
      if (accentColor === "#FF007F" && !ownedNonConsumables.includes("theme_cyber_neon")) {
        validatedAccent = null;
      } else if (accentColor === "#FF6B35" && !ownedNonConsumables.includes("theme_sora_light")) {
        validatedAccent = null;
      } else if (accentColor === "#000000" && !ownedNonConsumables.includes("theme_dark_material")) {
        validatedAccent = null;
      }

      if (validatedAccent) {
        baseColors.accent = validatedAccent;
        baseColors.accentLight = validatedAccent;
        baseColors.accentMuted = validatedAccent + "15";
      }
    }

    setActiveColors(baseColors);
  }, [themeMode, systemScheme, accentColor, ownedNonConsumables]);

  const isRtl = locale === "ar";

  // Invalidate profile cache so all screens pick up fresh user data
  const refreshUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }, []);

  const value: WamdhContextProps = {
    colors: activeColors,
    isDark,
    locale,
    isRtl,
    t,
    setLocale,
    user,
    logout,
    themeMode,
    setThemeMode: setThemeStoreMode,
    accentColor,
    setAccentColor,
    refreshUser,
    updateUserField,
  };

  return <WamdhContext.Provider value={value}>{children}</WamdhContext.Provider>;
}

// Hook to consume important app data and theme colors in any screen
export function useWamdh() {
  const context = useContext(WamdhContext);
  if (!context) {
    throw new Error("useWamdh must be used within a WamdhProvider");
  }
  return context;
}
