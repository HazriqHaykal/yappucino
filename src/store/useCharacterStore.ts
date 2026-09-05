import { create } from "zustand";
import { NAME_MAX_LENGTH } from "../data/characterOptions";
import type {
  Character,
  CharacterAccessoryId,
  CharacterBaseId,
  CharacterColorId,
} from "../types/character";

// Local-only for now — Firestore persistence needs a real user id, which
// lands with the Google Sign-In / Firebase Auth feature.
const initialState: Character = {
  baseId: "blob",
  color: "lavender",
  accessoryId: "none",
  name: "",
  mood: "happy",
  energy: 100,
};

interface CharacterStore extends Character {
  setBase: (baseId: CharacterBaseId) => void;
  setColor: (color: CharacterColorId) => void;
  setAccessory: (accessoryId: CharacterAccessoryId) => void;
  setName: (name: string) => void;
  setMood: (mood: string) => void;
  setEnergy: (energy: number) => void;
  createCharacter: () => Character;
  resetCharacter: () => void;
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  ...initialState,

  setBase: (baseId) => set({ baseId }),
  setColor: (color) => set({ color }),
  setAccessory: (accessoryId) => set({ accessoryId }),
  setName: (name) => set({ name: name.slice(0, NAME_MAX_LENGTH) }),
  setMood: (mood) => set({ mood }),
  setEnergy: (energy) => set({ energy: Math.max(0, Math.min(100, energy)) }),

  createCharacter: () => {
    const { baseId, color, accessoryId, name, mood, energy } = get();
    return { baseId, color, accessoryId, name, mood, energy };
  },

  resetCharacter: () => set({ ...initialState }),
}));
