import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { CHARACTER_COLORS } from "../data/characterOptions";
import type { CharacterColorId } from "../types/character";

interface ColorSelectorProps {
  color: CharacterColorId;
  onChange: (color: CharacterColorId) => void;
}

export default function ColorSelector({ color, onChange }: ColorSelectorProps) {
  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold tracking-wide text-ink">
        Choose a colour
      </legend>
      <div className="mt-3 flex gap-3">
        {CHARACTER_COLORS.map((c) => {
          const selected = c.id === color;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected}
              aria-label={c.name}
              title={c.name}
              onClick={() => onChange(c.id)}
              className="focus-ring relative flex h-11 w-11 items-center justify-center rounded-full"
            >
              {selected && (
                <motion.span
                  layoutId="color-selected-ring"
                  className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-paper"
                  style={{ "--tw-ring-color": c.shadeHex } as CSSProperties}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className="h-8 w-8 rounded-full border border-black/5"
                style={{ backgroundColor: c.hex }}
              />
              {selected && (
                <svg
                  viewBox="0 0 20 20"
                  className="absolute h-4 w-4 text-ink"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10.5l3.5 3.5L16 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
