import { create } from "zustand";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text1: string;
  text2?: string;
}

interface ToastState {
  toasts: ToastMessage[];
  show: (params: { type: "success" | "error" | "info"; text1: string; text2?: string }) => void;
  hide: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: ({ type, text1, text2 }) => {
    const id = Math.random().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, type, text1, text2 }],
    }));
    // Auto hide after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  hide: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
