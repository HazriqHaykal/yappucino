import { create } from "zustand";
import type { TherapySuggestion } from "../types/task";

interface TherapyStore {
  suggestions: TherapySuggestion[];
  addSuggestions: (suggestions: TherapySuggestion[]) => void;
  markTherapySuggestionContacted: (id: string) => void;
}

export const useTherapyStore = create<TherapyStore>((set) => ({
  suggestions: [],

  addSuggestions: (suggestions) =>
    set((state) => ({ suggestions: [...state.suggestions, ...suggestions] })),

  markTherapySuggestionContacted: (id) =>
    set((state) => ({
      suggestions: state.suggestions.map((suggestion) =>
        suggestion.id === id
          ? {
              ...suggestion,
              contacted: true,
              contactedAt: new Date().toISOString(),
            }
          : suggestion,
      ),
    })),
}));
