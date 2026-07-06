import { create } from "zustand";

interface ChatState {
  activeConversationId: string | null;
  typingRooms: Record<string, string[]>;
  setActiveConversation: (id: string | null) => void;
  setTyping: (roomId: string, userIds: string[]) => void;
  clearTyping: (roomId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  typingRooms: {},

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setTyping: (roomId, userIds) =>
    set((state) => ({
      typingRooms: { ...state.typingRooms, [roomId]: userIds },
    })),

  clearTyping: (roomId) =>
    set((state) => {
      const next = { ...state.typingRooms };
      delete next[roomId];
      return { typingRooms: next };
    }),
}));
