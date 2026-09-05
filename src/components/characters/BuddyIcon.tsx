import type { CharacterBaseId } from "../../types/character";
import { BlobBody, CloudBody, PuffBody, SproutBody } from "./bodies";
import { FACE_ANCHORS } from "./faceAnchors";

const BODY_COMPONENTS: Record<CharacterBaseId, typeof BlobBody> = {
  blob: BlobBody,
  puff: PuffBody,
  sprout: SproutBody,
  cloud: CloudBody,
};

interface BuddyIconProps {
  baseId: CharacterBaseId;
  fill: string;
  shade: string;
  className?: string;
}

// Static, non-animated silhouette used inside small selector cards.
export default function BuddyIcon({
  baseId,
  fill,
  shade,
  className = "",
}: BuddyIconProps) {
  const BodyComponent = BODY_COMPONENTS[baseId] ?? BlobBody;
  const { eyeY, eyeDX, mouthY } = FACE_ANCHORS[baseId] ?? FACE_ANCHORS.blob;

  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden="true">
      <BodyComponent fill={fill} shade={shade} />
      <circle cx={100 - eyeDX} cy={eyeY} r="6" fill="#33281F" />
      <circle cx={100 + eyeDX} cy={eyeY} r="6" fill="#33281F" />
      <path
        d={`M ${100 - 12} ${mouthY} Q 100 ${mouthY + 9} ${100 + 12} ${mouthY}`}
        fill="none"
        stroke="#33281F"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
