import { AnimatePresence, motion } from "framer-motion";
import { getColorById } from "../../data/characterOptions";
import type {
  CharacterAccessoryId,
  CharacterBaseId,
  CharacterColorId,
} from "../../types/character";
import Accessory from "./Accessory";
import { BlobBody, CloudBody, PuffBody, SproutBody } from "./bodies";
import Face from "./Face";
import { FACE_ANCHORS } from "./faceAnchors";

const BODY_COMPONENTS: Record<CharacterBaseId, typeof BlobBody> = {
  blob: BlobBody,
  puff: PuffBody,
  sprout: SproutBody,
  cloud: CloudBody,
};

interface BuddyCharacterProps {
  baseId?: CharacterBaseId;
  colorId?: CharacterColorId;
  accessoryId?: CharacterAccessoryId;
  excited?: boolean;
  className?: string;
}

export default function BuddyCharacter({
  baseId = "blob",
  colorId = "lavender",
  accessoryId = "none",
  excited = false,
  className = "",
}: BuddyCharacterProps) {
  const BodyComponent = BODY_COMPONENTS[baseId] ?? BlobBody;
  const color = getColorById(colorId);
  const anchors = FACE_ANCHORS[baseId] ?? FACE_ANCHORS.blob;

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.svg
        viewBox="0 0 200 220"
        className="h-full w-full drop-shadow-[0_18px_28px_rgba(60,45,30,0.18)]"
        animate={{ scale: [1, 1.025, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="100" cy="204" rx="52" ry="10" fill="#33281F" opacity="0.1" />

        <AnimatePresence mode="wait">
          <motion.g
            key={baseId}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <BodyComponent fill={color.hex} shade={color.shadeHex} />
            <Face anchors={anchors} excited={excited} />
          </motion.g>
        </AnimatePresence>

        <AnimatePresence>
          {accessoryId !== "none" && (
            <Accessory
              key={accessoryId}
              id={accessoryId}
              anchors={anchors}
              shade={color.shadeHex}
            />
          )}
        </AnimatePresence>
      </motion.svg>
    </motion.div>
  );
}
