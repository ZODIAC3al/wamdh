import { create } from "zustand";
import type { UserRole } from "./authStore";

interface UiState {
  hubVisible: boolean;
  hubRole: UserRole | null;
  openHub: (role: UserRole) => void;
  closeHub: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  hubVisible: false,
  hubRole: null,
  openHub: (role) => set({ hubVisible: true, hubRole: role }),
  closeHub: () => set({ hubVisible: false, hubRole: null }),
}));
