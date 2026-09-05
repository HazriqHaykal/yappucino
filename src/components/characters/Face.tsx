import { motion } from "framer-motion";
import type { FaceAnchors } from "../../types/character";

interface FaceProps {
  anchors: FaceAnchors;
  excited: boolean;
}

export default function Face({ anchors, excited }: FaceProps) {
  const { eyeY, eyeDX, mouthY } = anchors;

  return (
    <g>
      <ellipse
        cx={100 - eyeDX - 14}
        cy={eyeY + 10}
        rx="10"
        ry="6"
        fill="#E98A63"
        opacity="0.45"
      />
      <ellipse
        cx={100 + eyeDX + 14}
        cy={eyeY + 10}
        rx="10"
        ry="6"
        fill="#E98A63"
        opacity="0.45"
      />

      <motion.ellipse
        cx={100 - eyeDX}
        cy={eyeY}
        rx="6"
        ry="7.5"
        fill="#33281F"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          repeatDelay: 1.6,
          times: [0, 0.85, 0.9, 0.95, 1],
          ease: "easeInOut",
        }}
      />
      <motion.ellipse
        cx={100 + eyeDX}
        cy={eyeY}
        rx="6"
        ry="7.5"
        fill="#33281F"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          repeatDelay: 1.6,
          times: [0, 0.85, 0.9, 0.95, 1],
          ease: "easeInOut",
        }}
      />

      <motion.path
        fill="none"
        stroke="#33281F"
        strokeWidth="4"
        strokeLinecap="round"
        initial={false}
        animate={{
          d: excited
            ? `M ${100 - 15} ${mouthY - 2} Q 100 ${mouthY + 16} ${100 + 15} ${mouthY - 2}`
            : `M ${100 - 12} ${mouthY} Q 100 ${mouthY + 9} ${100 + 12} ${mouthY}`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      />
    </g>
  );
}
