import { motion } from "framer-motion";
import { CHARACTER_ACCESSORIES } from "../data/characterOptions";
import type { CharacterAccessoryId } from "../types/character";

interface AccessorySelectorProps {
  accessoryId: CharacterAccessoryId;
  onChange: (accessoryId: CharacterAccessoryId) => void;
}

export default function AccessorySelector({
  accessoryId,
  onChange,
}: AccessorySelectorProps) {
  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold tracking-wide text-ink">
        Accessory
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHARACTER_ACCESSORIES.map((accessory) => {
          const selected = accessory.id === accessoryId;
          return (
            <button
              key={accessory.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(accessory.id)}
              className={`focus-ring relative overflow-hidden rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                selected
                  ? "border-clay text-white"
                  : "border-line bg-paper-card text-ink-soft hover:border-ink-faint"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="accessory-selected-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-clay"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {accessory.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
