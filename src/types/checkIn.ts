export type Mood = "happy" | "calm" | "sad" | "stress" | "tired" | "excited";

export interface MoodOption {
  id: Mood;
  emoji: string;
  label: string;
}

// Single source of truth for mood emoji/labels — shared between the room's
// mood badge and the check-in mood picker so they never drift apart.
export const MOOD_OPTIONS: MoodOption[] = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "stress", emoji: "😖", label: "Stress" },
  { id: "tired", emoji: "🥱", label: "Tired" },
  { id: "excited", emoji: "🤩", label: "Excited" },
];

// Loosely typed (not Record<Mood, string>) because it's indexed by
// Character.mood, which is a plain string, not the Mood union.
export const MOOD_EMOJI: Record<string, string> = Object.fromEntries(
  MOOD_OPTIONS.map((option) => [option.id, option.emoji]),
);

export interface CheckIn {
  id: string;
  mood: Mood;
  note: string;
  createdAt: string;
}
