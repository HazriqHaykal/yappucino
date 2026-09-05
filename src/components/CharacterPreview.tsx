import { AnimatePresence, motion } from "framer-motion";
import { getColorById } from "../data/characterOptions";
import type {
  CharacterAccessoryId,
  CharacterBaseId,
  CharacterColorId,
} from "../types/character";
import BuddyCharacter from "./characters/BuddyCharacter";

const SPARKLE_OFFSETS = [
  { x: -70, y: -30, delay: 0 },
  { x: 68, y: -50, delay: 0.12 },
  { x: 80, y: 30, delay: 0.24 },
];

interface CharacterPreviewProps {
  baseId: CharacterBaseId;
  colorId: CharacterColorId;
  accessoryId: CharacterAccessoryId;
  name: string;
  celebrate?: boolean;
}

export default function CharacterPreview({
  baseId,
  colorId,
  accessoryId,
  name,
  celebrate = false,
}: CharacterPreviewProps) {
  const color = getColorById(colorId);
  const excited = name.trim().length > 0;

  return (
    <div
      role="img"
      aria-label={`Your buddy: a ${color.name.toLowerCase()} ${name || "unnamed buddy"}`}
      className="relative flex aspect-square w-full max-w-[22rem] items-center justify-center overflow-hidden rounded-[2.5rem] border border-line bg-paper-card shadow-[0_2px_0_rgba(51,40,31,0.04)] sm:aspect-[4/3.6]"
    >
      <div
        className="absolute h-[80%] w-[80%] rounded-full opacity-50 blur-3xl transition-colors duration-500"
        style={{ backgroundColor: color.hex }}
      />
      <div className="absolute inset-6 rounded-[2rem] border border-line-soft" />

      <div className="relative h-[62%] w-[62%]">
        <BuddyCharacter
          baseId={baseId}
          colorId={colorId}
          accessoryId={accessoryId}
          excited={excited}
          className="h-full w-full"
        />
      </div>

      <AnimatePresence>
        {excited &&
          SPARKLE_OFFSETS.map((s, i) => (
            <motion.span
              key={`spark-${i}`}
              className="absolute text-xl"
              style={{ left: "50%", top: "50%" }}
              initial={{ opacity: 0, x: s.x * 0.4, y: s.y * 0.4, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], x: s.x, y: s.y, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: s.delay,
                ease: "easeOut",
              }}
            >
              ✨
            </motion.span>
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {celebrate && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-paper-card/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
