import { motion, type Variants } from "framer-motion";
import type { CharacterAccessoryId, FaceAnchors } from "../../types/character";

const accessoryVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: -6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 20 },
  },
};

interface AccessoryPartProps {
  anchors: FaceAnchors;
  shade: string;
}

function Beanie({ anchors, shade }: AccessoryPartProps) {
  const { headTopY, headWidth } = anchors;
  const r = headWidth / 2 + 6;
  const topY = headTopY + 6;
  return (
    <motion.g
      variants={accessoryVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <path
        d={`M ${100 - r} ${topY} A ${r} 34 0 0 1 ${100 + r} ${topY} Z`}
        fill="#FFF7EA"
      />
      <rect
        x={100 - r - 2}
        y={topY - 4}
        width={r * 2 + 4}
        height={16}
        rx={8}
        fill={shade}
      />
      <circle cx={100} cy={topY - 32} r={9} fill={shade} />
    </motion.g>
  );
}

function Glasses({ anchors }: Pick<AccessoryPartProps, "anchors">) {
  const { eyeY, eyeDX } = anchors;
  const r = 17;
  return (
    <motion.g
      variants={accessoryVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <line
        x1={100 - eyeDX + r}
        y1={eyeY}
        x2={100 + eyeDX - r}
        y2={eyeY}
        stroke="#3B332C"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={100 - eyeDX - r}
        y1={eyeY - 2}
        x2={100 - eyeDX - r - 10}
        y2={eyeY - 6}
        stroke="#3B332C"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={100 + eyeDX + r}
        y1={eyeY - 2}
        x2={100 + eyeDX + r + 10}
        y2={eyeY - 6}
        stroke="#3B332C"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx={100 - eyeDX}
        cy={eyeY}
        r={r}
        fill="rgba(255,255,255,0.35)"
        stroke="#3B332C"
        strokeWidth="4"
      />
      <circle
        cx={100 + eyeDX}
        cy={eyeY}
        r={r}
        fill="rgba(255,255,255,0.35)"
        stroke="#3B332C"
        strokeWidth="4"
      />
    </motion.g>
  );
}

function Headphones({ anchors, shade }: AccessoryPartProps) {
  const { headWidth, eyeY } = anchors;
  const halfW = headWidth / 2 + 4;
  return (
    <motion.g
      variants={accessoryVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <path
        d={`M ${100 - halfW} ${eyeY - 6} A ${halfW} ${halfW - 6} 0 0 1 ${100 + halfW} ${eyeY - 6}`}
        fill="none"
        stroke="#3B332C"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect
        x={100 - halfW - 11}
        y={eyeY - 18}
        width={22}
        height={34}
        rx={11}
        fill="#3B332C"
      />
      <rect
        x={100 - halfW - 7}
        y={eyeY - 12}
        width={14}
        height={22}
        rx={7}
        fill={shade}
      />
      <rect
        x={100 + halfW - 11}
        y={eyeY - 18}
        width={22}
        height={34}
        rx={11}
        fill="#3B332C"
      />
      <rect
        x={100 + halfW - 7}
        y={eyeY - 12}
        width={14}
        height={22}
        rx={7}
        fill={shade}
      />
    </motion.g>
  );
}

interface AccessoryProps {
  id: CharacterAccessoryId;
  anchors: FaceAnchors;
  shade: string;
}

export default function Accessory({ id, anchors, shade }: AccessoryProps) {
  if (id === "beanie") return <Beanie anchors={anchors} shade={shade} />;
  if (id === "glasses") return <Glasses anchors={anchors} />;
  if (id === "headphones") return <Headphones anchors={anchors} shade={shade} />;
  return null;
}
