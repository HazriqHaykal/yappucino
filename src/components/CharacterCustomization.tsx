import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  getAccessoryById,
  getBaseById,
  getColorById,
} from "../data/characterOptions";
import { useCharacterStore } from "../store/useCharacterStore";
import type { Character } from "../types/character";
import AccessorySelector from "./AccessorySelector";
import CharacterBaseSelector from "./CharacterBaseSelector";
import CharacterNameInput from "./CharacterNameInput";
import CharacterPreview from "./CharacterPreview";
import ColorSelector from "./ColorSelector";

interface CharacterCustomizationProps {
  onCreated?: (character: Character) => void;
}

export default function CharacterCustomization({
  onCreated,
}: CharacterCustomizationProps) {
  const baseId = useCharacterStore((s) => s.baseId);
  const color = useCharacterStore((s) => s.color);
  const accessoryId = useCharacterStore((s) => s.accessoryId);
  const name = useCharacterStore((s) => s.name);
  const setBase = useCharacterStore((s) => s.setBase);
  const setColor = useCharacterStore((s) => s.setColor);
  const setAccessory = useCharacterStore((s) => s.setAccessory);
  const setName = useCharacterStore((s) => s.setName);
  const createCharacter = useCharacterStore((s) => s.createCharacter);

  const [celebrating, setCelebrating] = useState(false);

  const trimmedName = name.trim();
  const canCreate = trimmedName.length > 0 && !celebrating;

  const base = getBaseById(baseId);
  const colorOption = getColorById(color);
  const accessory = getAccessoryById(accessoryId);

  const handleCreate = () => {
    if (!canCreate) return;
    setCelebrating(true);
    const character = createCharacter();
    window.setTimeout(() => {
      onCreated?.(character);
    }, 1300);
  };

  return (
    <main className="min-h-screen w-full px-5 py-10 sm:px-8 sm:py-14 lg:px-16 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center lg:mb-14 lg:text-left">
          <p className="font-display text-xs font-bold tracking-[0.24em] text-clay uppercase">
            Pace
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Meet your Pace buddy.
          </h1>
          <p className="mt-2 text-base text-ink-soft">
            Your little companion for keeping life in balance.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <CharacterPreview
              baseId={baseId}
              colorId={color}
              accessoryId={accessoryId}
              name={name}
              celebrate={celebrating}
            />
          </div>

          <div className="order-2 flex flex-col gap-8 lg:order-1 lg:pt-2">
            <CharacterBaseSelector
              baseId={baseId}
              colorId={color}
              onChange={setBase}
            />
            <ColorSelector color={color} onChange={setColor} />
            <AccessorySelector
              accessoryId={accessoryId}
              onChange={setAccessory}
            />
            <CharacterNameInput name={name} onChange={setName} />
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-5 items-center">
            <AnimatePresence mode="wait">
              {trimmedName && (
                <motion.p
                  key={trimmedName}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm text-ink-soft"
                >
                  <span className="font-display font-semibold text-ink">
                    {trimmedName}
                  </span>{" "}
                  — {base.name} · {colorOption.name}
                  {accessoryId !== "none" ? ` · ${accessory.name}` : ""}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            whileTap={canCreate ? { scale: 0.96 } : undefined}
            className={`focus-ring w-full rounded-full px-8 py-3.5 font-display text-base font-semibold transition-colors ${
              canCreate
                ? "bg-clay text-white shadow-[0_10px_24px_rgba(217,118,74,0.28)] hover:bg-clay-dark"
                : "cursor-not-allowed bg-line text-ink-faint"
            }`}
          >
            {celebrating ? "Buddy created! 🎉" : "Create My Buddy"}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
