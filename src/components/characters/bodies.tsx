// Simple, distinct SVG silhouettes for each buddy base.
// Kept intentionally primitive (paths + circles) so they are trivial to
// swap out for Rive/Lottie assets later without touching layout logic.

interface BodyProps {
  fill: string;
  shade: string;
}

export function BlobBody({ fill, shade }: BodyProps) {
  return (
    <g>
      <path
        d="M100,52 C136,52 168,74 174,112 C180,152 154,190 108,192 C64,194 30,166 26,124 C22,82 58,52 100,52 Z"
        fill={fill}
      />
      <path
        d="M60,80 C70,64 88,56 100,56 C80,58 66,70 60,86 Z"
        fill={shade}
        opacity="0.55"
      />
      <ellipse cx="72" cy="150" rx="34" ry="16" fill={shade} opacity="0.25" />
    </g>
  );
}

export function PuffBody({ fill, shade }: BodyProps) {
  const tufts: [number, number, number][] = [
    [50, 66, 15],
    [80, 48, 16],
    [120, 48, 16],
    [150, 66, 15],
    [40, 104, 14],
    [160, 104, 14],
    [58, 146, 14],
    [142, 146, 14],
  ];
  return (
    <g>
      {tufts.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
      <circle cx="100" cy="112" r="66" fill={fill} />
      <path
        d="M56,84 C66,66 84,56 100,56 C78,58 62,70 54,90 Z"
        fill={shade}
        opacity="0.5"
      />
      <ellipse cx="74" cy="140" rx="32" ry="15" fill={shade} opacity="0.22" />
    </g>
  );
}

export function SproutBody({ fill, shade }: BodyProps) {
  return (
    <g>
      <path
        d="M100,42 C104,54 108,62 100,66 C92,62 96,54 100,42 Z"
        fill="#6FA96A"
      />
      <path
        d="M100,50 C112,44 126,46 132,54 C120,58 108,58 100,52 Z"
        fill="#7FBB78"
      />
      <path
        d="M100,50 C88,44 74,46 68,54 C80,58 92,58 100,52 Z"
        fill="#6FA96A"
      />
      <path
        d="M100,74 C132,74 156,98 158,132 C160,166 134,194 100,194 C66,194 40,166 42,132 C44,98 68,74 100,74 Z"
        fill={fill}
      />
      <path
        d="M62,98 C72,84 86,76 100,76 C82,78 68,88 60,104 Z"
        fill={shade}
        opacity="0.5"
      />
      <ellipse cx="72" cy="152" rx="30" ry="14" fill={shade} opacity="0.25" />
    </g>
  );
}

export function CloudBody({ fill, shade }: BodyProps) {
  return (
    <g>
      <circle cx="66" cy="118" r="34" fill={fill} />
      <circle cx="134" cy="118" r="34" fill={fill} />
      <circle cx="90" cy="94" r="30" fill={fill} />
      <circle cx="112" cy="94" r="30" fill={fill} />
      <rect x="42" y="112" width="116" height="66" rx="33" fill={fill} />
      <path
        d="M70,92 C82,80 96,76 108,78 C92,80 80,88 74,100 Z"
        fill={shade}
        opacity="0.5"
      />
      <ellipse cx="76" cy="150" rx="30" ry="13" fill={shade} opacity="0.22" />
    </g>
  );
}
