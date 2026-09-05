import type { CharacterBaseId, FaceAnchors } from "../../types/character";

export const FACE_ANCHORS: Record<CharacterBaseId, FaceAnchors> = {
  blob: { eyeY: 104, eyeDX: 24, mouthY: 132, headTopY: 58, headWidth: 78 },
  puff: { eyeY: 108, eyeDX: 23, mouthY: 134, headTopY: 50, headWidth: 82 },
  sprout: { eyeY: 128, eyeDX: 21, mouthY: 152, headTopY: 78, headWidth: 68 },
  cloud: { eyeY: 116, eyeDX: 25, mouthY: 138, headTopY: 76, headWidth: 82 },
};
