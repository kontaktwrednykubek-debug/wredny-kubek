import { create } from "zustand";

interface AssistantStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAssistantStore = create<AssistantStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
