import { motion } from "framer-motion";
import { CHARACTER_BASES, getColorById } from "../data/characterOptions";
import type { CharacterBaseId, CharacterColorId } from "../types/character";
import BuddyIcon from "./characters/BuddyIcon";

interface CharacterBaseSelectorProps {
  baseId: CharacterBaseId;
  colorId: CharacterColorId;
  onChange: (baseId: CharacterBaseId) => void;
}

export default function CharacterBaseSelector({
  baseId,
  colorId,
  onChange,
}: CharacterBaseSelectorProps) {
  const color = getColorById(colorId);

  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold tracking-wide text-ink">
        Choose your buddy
      </legend>
      <div className="mt-3 grid grid-cols-4 gap-2.5 sm:gap-3">
        {CHARACTER_BASES.map((base) => {
          const selected = base.id === baseId;
          return (
            <button
              key={base.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(base.id)}
              className={`focus-ring group relative flex flex-col items-center gap-1 rounded-2xl border bg-paper-card px-2 py-2.5 transition-colors sm:py-3 ${
                selected ? "border-clay" : "border-line hover:border-ink-faint"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="base-selected-ring"
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-clay"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <BuddyIcon
                baseId={base.id}
                fill={color.hex}
                shade={color.shadeHex}
                className="h-10 w-10 sm:h-12 sm:w-12"
              />
              <span className="text-[11px] font-semibold text-ink-soft sm:text-xs">
                {base.name}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
