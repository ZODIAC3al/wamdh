import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  accentColor: string | null;
  initialized: boolean;
  initializeTheme: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  setAccentColor: (color: string | null) => Promise<void>;
}

const isWeb = Platform.OS === "web";
const STORAGE_KEY = "wamdh_theme_mode";
const ACCENT_KEY = "wamdh_theme_accent";

const getItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.error("themeStore save error", e);
  }
};

const removeItem = async (key: string): Promise<void> => {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.error("themeStore delete error", e);
  }
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  accentColor: null,
  initialized: false,

  initializeTheme: async () => {
    const stored = await getItem(STORAGE_KEY);
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const storedAccent = await getItem(ACCENT_KEY);
    set({ mode, accentColor: storedAccent, initialized: true });
  },

  setMode: async (mode) => {
    await setItem(STORAGE_KEY, mode);
    set({ mode });
  },

  setAccentColor: async (color) => {
    if (color) {
      await setItem(ACCENT_KEY, color);
    } else {
      await removeItem(ACCENT_KEY);
    }
    set({ accentColor: color });
  },
}));
