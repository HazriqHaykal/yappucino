export type CharacterBaseId = "blob" | "puff" | "sprout" | "cloud";

export type CharacterColorId = "lavender" | "sky" | "mint" | "peach" | "yellow";

export type CharacterAccessoryId =
  | "none"
  | "beanie"
  | "glasses"
  | "headphones";

export interface CharacterBase {
  id: CharacterBaseId;
  name: string;
  tagline: string;
}

export interface CharacterColorOption {
  id: CharacterColorId;
  name: string;
  hex: string;
  shadeHex: string;
}

export interface CharacterAccessoryOption {
  id: CharacterAccessoryId;
  name: string;
}

export interface FaceAnchors {
  eyeY: number;
  eyeDX: number;
  mouthY: number;
  headTopY: number;
  headWidth: number;
}

export interface Character {
  baseId: CharacterBaseId;
  color: CharacterColorId;
  accessoryId: CharacterAccessoryId;
  name: string;
  mood: string;
  energy: number;
}
