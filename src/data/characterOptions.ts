import type {
  CharacterAccessoryId,
  CharacterAccessoryOption,
  CharacterBase,
  CharacterBaseId,
  CharacterColorId,
  CharacterColorOption,
} from "../types/character";

export const CHARACTER_BASES: CharacterBase[] = [
  { id: "blob", name: "Blob", tagline: "Squishy & easygoing" },
  { id: "puff", name: "Puff", tagline: "Light & fluffy" },
  { id: "sprout", name: "Sprout", tagline: "Grounded & growing" },
  { id: "cloud", name: "Cloud", tagline: "Calm & airy" },
];

export const CHARACTER_COLORS: CharacterColorOption[] = [
  { id: "lavender", name: "Lavender", hex: "#C9B6E4", shadeHex: "#A98FCB" },
  { id: "sky", name: "Sky", hex: "#A9D4E8", shadeHex: "#7EB4CE" },
  { id: "mint", name: "Mint", hex: "#A7DCC4", shadeHex: "#7CBFA1" },
  { id: "peach", name: "Peach", hex: "#F4B79A", shadeHex: "#E4936A" },
  { id: "yellow", name: "Yellow", hex: "#F6D889", shadeHex: "#E9BE55" },
];

export const CHARACTER_ACCESSORIES: CharacterAccessoryOption[] = [
  { id: "none", name: "None" },
  { id: "beanie", name: "Beanie" },
  { id: "glasses", name: "Glasses" },
  { id: "headphones", name: "Headphones" },
];

export const NAME_MAX_LENGTH = 16;

export const getBaseById = (id: CharacterBaseId): CharacterBase =>
  CHARACTER_BASES.find((base) => base.id === id) ?? CHARACTER_BASES[0];

export const getColorById = (id: CharacterColorId): CharacterColorOption =>
  CHARACTER_COLORS.find((color) => color.id === id) ?? CHARACTER_COLORS[0];

export const getAccessoryById = (
  id: CharacterAccessoryId,
): CharacterAccessoryOption =>
  CHARACTER_ACCESSORIES.find((accessory) => accessory.id === id) ??
  CHARACTER_ACCESSORIES[0];
