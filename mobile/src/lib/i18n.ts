import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export type Locale = "en" | "ar";

const isWeb = Platform.OS === "web";

const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isWeb) {
      return typeof window !== "undefined" ? window.localStorage.getItem(name) : null;
    }
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (isWeb) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(name, value);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch { }
  },
  removeItem: async (name: string): Promise<void> => {
    if (isWeb) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(name);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch { }
  }
};

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
};

interface LanguageStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
      t: (key) => {
        const active = get().locale;
        return TRANSLATIONS[active][key] || TRANSLATIONS.en[key] || String(key);
      }
    }),
    {
      name: "wamdh-locale-store",
      storage: createJSONStorage(() => customStorage),
    }
  )
);
