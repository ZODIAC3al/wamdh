import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const WEB_STORAGE_KEY = "wamdh_auth";

const webStorage = {
  get: () => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const item = window.sessionStorage.getItem(WEB_STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    }
    return null;
  },
  set: (data: any) => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(data));
    }
  },
  remove: () => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(WEB_STORAGE_KEY);
    }
  },
};

export type UserRole = "student" | "instructor" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profile_photo_url?: string;
  banner_image_url?: string;
  bio?: string;
  xp_points: number;
  streak_days: number;
  is_premium?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  profileVersion: number;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
  updateUserField: (fields: Partial<User>) => Promise<void>;
}

const isWeb = Platform.OS === "web";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  profileVersion: 0,

  login: async (accessToken, refreshToken, user) => {
    try {
      const storageData = { accessToken, refreshToken, user, timestamp: Date.now() };
      if (isWeb) {
        webStorage.set(storageData);
      } else {
        await SecureStore.setItemAsync(WEB_STORAGE_KEY, JSON.stringify(storageData));
      }
      set((s) => ({ accessToken, refreshToken, user, isLoading: false, profileVersion: s.profileVersion + 1 }));
    } catch (e) {
      console.error("Failed to save auth tokens", e);
    }
  },

  logout: async () => {
    try {
      if (isWeb) {
        webStorage.remove();
      } else {
        await SecureStore.deleteItemAsync(WEB_STORAGE_KEY);
      }
      set({ accessToken: null, refreshToken: null, user: null, isLoading: false });
    } catch (e) {
      console.error("Failed to delete auth tokens", e);
    }
  },

  initializeAuth: async () => {
    try {
      let data: { accessToken: string; refreshToken: string; user: User } | null = null;
      if (isWeb) {
        data = webStorage.get();
      } else {
        const stored = await SecureStore.getItemAsync(WEB_STORAGE_KEY);
        data = stored ? JSON.parse(stored) : null;
      }
      
      if (data && data.accessToken && data.refreshToken && data.user) {
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user, isLoading: false });
      } else {
        set({ accessToken: null, refreshToken: null, user: null, isLoading: false });
      }
    } catch (e) {
      console.error("Failed to initialize auth state", e);
      set({ accessToken: null, refreshToken: null, user: null, isLoading: false });
    }
  },

  setUser: async (user) => {
    try {
      const current = get();
      if (current.accessToken && current.refreshToken) {
        const storageData = { accessToken: current.accessToken, refreshToken: current.refreshToken, user, timestamp: Date.now() };
        if (isWeb) {
          webStorage.set(storageData);
        } else {
          await SecureStore.setItemAsync(WEB_STORAGE_KEY, JSON.stringify(storageData));
        }
        set((s) => ({ user, profileVersion: s.profileVersion + 1 }));
      }
    } catch (e) {
      console.error("Failed to save user data", e);
    }
  },

  updateUserField: async (fields) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...fields };
    try {
      const accessToken = get().accessToken || "";
      const refreshToken = get().refreshToken || "";
      const storageData = { accessToken, refreshToken, user: updated, timestamp: Date.now() };
      if (isWeb) {
        webStorage.set(storageData);
      } else {
        await SecureStore.setItemAsync(WEB_STORAGE_KEY, JSON.stringify(storageData));
      }
      set((s) => ({ user: updated, profileVersion: s.profileVersion + 1 }));
    } catch (e) {
      console.error("Failed to update user field", e);
    }
  },
}));