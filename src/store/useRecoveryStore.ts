import { create } from "zustand";
import type { RecoverySuggestion } from "../types/task";

interface RecoveryStore {
  suggestions: RecoverySuggestion[];
  addSuggestion: (suggestion: RecoverySuggestion) => void;
  addSuggestions: (suggestions: RecoverySuggestion[]) => void;
  /** Sets completed: true and completedAt on the matching suggestion. This
   * is the full extent of what this feature does about "room brightening"
   * — Person A's room UI reads this completed state to decide how to
   * render it; no visual/animation logic belongs here. */
  completeRecoverySuggestion: (id: string) => void;
}

export const useRecoveryStore = create<RecoveryStore>((set) => ({
  suggestions: [],

  addSuggestion: (suggestion) =>
    set((state) => ({ suggestions: [...state.suggestions, suggestion] })),

  addSuggestions: (suggestions) =>
    set((state) => ({ suggestions: [...state.suggestions, ...suggestions] })),

  completeRecoverySuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.map((suggestion) =>
        suggestion.id === id
          ? {
              ...suggestion,
              completed: true,
              completedAt: new Date().toISOString(),
            }
          : suggestion,
      ),
    })),
}));
