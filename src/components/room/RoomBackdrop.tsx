const SHELF_BOOK_X = [18, 26, 34, 42, 50, 58];
const SHELF_BOOK_COLORS = [
  "#c9b6e4",
  "#a7dcc4",
  "#f6d889",
  "#f4b79a",
  "#a9d4e8",
  "#e9be55",
];

// Static isometric-style room illustration. Object coordinates below are in
// this SVG's own 200x120 viewBox space; RoomScene positions its floating
// zone cards using the same percentages (x/200, y/120) to line up with it.
export default function RoomBackdrop() {
  return (
    <>
      <svg
        viewBox="0 0 200 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8f0e2" />
            <stop offset="100%" stopColor="#f0e5d1" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8ddc9" />
            <stop offset="100%" stopColor="#edc4a4" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d3ecf6" />
            <stop offset="100%" stopColor="#8fc2dd" />
          </linearGradient>
          <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0895c" />
            <stop offset="100%" stopColor="#bd5c37" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c3e2ef" />
            <stop offset="55%" stopColor="#7eb4ce" />
            <stop offset="100%" stopColor="#5c95b1" />
          </linearGradient>
          <linearGradient id="blanketGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cdbbe6" />
            <stop offset="100%" stopColor="#a98fcb" />
          </linearGradient>
          <radialGradient id="rugGrad" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#fae7b2" />
            <stop offset="100%" stopColor="#eeba63" />
          </radialGradient>
          <filter id="softShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow
              dx="0"
              dy="1.5"
              stdDeviation="1.5"
              floodColor="#33281f"
              floodOpacity="0.22"
            />
          </filter>
        </defs>

        {/* wall */}
        <rect x="0" y="0" width="200" height="66" fill="url(#wallGrad)" />
        <rect x="0" y="62" width="200" height="6" fill="#ecdfca" />

        {/* floor — extended up from the original y=80 boundary to give more
            floor space at the bottom of the scene */}
        <rect x="0" y="68" width="200" height="52" fill="url(#floorGrad)" />
        {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) => (
          <rect key={x} x={x} y="68" width="1" height="52" fill="#c47a4c" opacity="0.18" />
        ))}

        {/* window */}
        <rect x="133" y="7" width="7" height="33" rx="3" fill="#f4b79a" opacity="0.85" />
        <rect x="186" y="7" width="7" height="33" rx="3" fill="#f4b79a" opacity="0.85" />
        <rect x="140" y="10" width="46" height="34" rx="4" fill="#fffcf6" filter="url(#softShadow)" />
        <rect x="144" y="14" width="38" height="26" rx="3" fill="url(#skyGrad)" />
        <ellipse cx="151" cy="19" rx="6" ry="2.4" fill="#ffffff" opacity="0.8" />
        <ellipse cx="159" cy="17.5" rx="4.5" ry="1.9" fill="#ffffff" opacity="0.7" />
        <rect x="162" y="14" width="3" height="26" fill="#fffcf6" />
        <rect x="144" y="25.5" width="38" height="3" fill="#fffcf6" />
        <rect x="138" y="44" width="50" height="4" rx="2" fill="#e4d3ba" />

        {/* shelf */}
        <rect x="14" y="14" width="52" height="5" rx="2.5" fill="#ecdfca" filter="url(#softShadow)" />
        <rect x="14" y="35" width="52" height="5" rx="2.5" fill="#ecdfca" filter="url(#softShadow)" />
        {SHELF_BOOK_X.map((x, i) => (
          <rect key={x} x={x} y="20" width="6" height="14" rx="1.5" fill={SHELF_BOOK_COLORS[i]} />
        ))}
        <rect x="36" y="6" width="6" height="6" rx="1" fill="#bd5c37" />
        <circle cx="39" cy="4" r="3" fill="#7cbfa1" />
        <circle cx="36" cy="5.5" r="2.4" fill="#a7dcc4" />
        <circle cx="42" cy="5.5" r="2.4" fill="#a7dcc4" />

        {/* bed, tucked into the right wall, fully inside the frame */}
        <rect x="136" y="52" width="8" height="56" rx="3" fill="#a8532f" filter="url(#softShadow)" />
        <rect x="140" y="96" width="58" height="14" rx="4" fill="#c96b42" filter="url(#softShadow)" />
        <rect x="140" y="70" width="58" height="30" rx="6" fill="#fffcf6" filter="url(#softShadow)" />
        <ellipse cx="155" cy="78" rx="13" ry="7" fill="#fffcf6" filter="url(#softShadow)" />
        <ellipse cx="155" cy="80" rx="9" ry="4.5" fill="#f2e8d7" opacity="0.6" />
        <rect x="140" y="86" width="58" height="18" rx="6" fill="url(#blanketGrad)" />
        {[91, 96, 101].map((y) => (
          <rect key={y} x="142" y={y} width="54" height="1" fill="#8a71ad" opacity="0.3" />
        ))}
        <circle cx="188" cy="94" r="3.5" fill="#7cbfa1" />
        <ellipse cx="186.5" cy="92.5" rx="1.3" ry="0.9" fill="#ffffff" opacity="0.5" />

        {/* rug */}
        <ellipse cx="100" cy="102" rx="34" ry="10" fill="url(#rugGrad)" opacity="0.6" />
        <ellipse cx="100" cy="102" rx="22" ry="6.5" fill="#fffcf6" opacity="0.35" />

        {/* laptop on the rug — the People/Social zone's spot */}
        <path d="M105,109 L131,109 L127,112.5 L109,112.5 Z" fill="#5c95b1" />
        <rect x="107" y="99" width="18" height="10.5" rx="1.5" fill="#33281f" />
        <rect x="108.6" y="100.5" width="14.8" height="7.5" rx="0.8" fill="url(#screenGrad)" />

        {/* dumbbell on the floor beside the bed — the Health/Physical zone's spot */}
        <rect x="156" y="112" width="12" height="3" rx="1.5" fill="#7a6a5b" />
        <circle cx="155" cy="113.5" r="4.2" fill="#33281f" opacity="0.85" />
        <circle cx="169" cy="113.5" r="4.2" fill="#33281f" opacity="0.85" />

        {/* desk */}
        <path d="M31,58 C31,66 34,70 34,80" stroke="#33281f" strokeWidth="1" fill="none" opacity="0.25" />
        <rect x="10" y="58" width="54" height="8" rx="3" fill="url(#deskGrad)" filter="url(#softShadow)" />
        <rect x="30" y="66" width="16" height="8" rx="2" fill="#c96b42" />
        <rect x="36" y="69" width="4" height="1.5" rx="0.75" fill="#33281f" opacity="0.6" />
        <rect x="14" y="66" width="6" height="14" rx="2" fill="#a8532f" />
        <rect x="54" y="66" width="6" height="14" rx="2" fill="#a8532f" />

        {/* keyboard + mug */}
        <rect x="20" y="60" width="20" height="4" rx="1.5" fill="#fffcf6" />
        <rect x="47" y="59.5" width="5" height="5" rx="1" fill="#d9764a" />
        <rect x="52" y="61" width="2" height="2.2" rx="1" fill="none" stroke="#d9764a" strokeWidth="0.8" />

        {/* monitor, flush on the desk */}
        <rect x="18" y="36" width="26" height="22" rx="3" fill="#33281f" filter="url(#softShadow)" />
        <rect x="21" y="39" width="20" height="16" rx="2" fill="url(#screenGrad)" />

        {/* desk calendar — opens the Weekly Recap */}
        <rect
          x="48"
          y="40"
          width="14"
          height="16"
          rx="1.5"
          fill="#fffcf6"
          filter="url(#softShadow)"
        />
        <rect x="48" y="40" width="14" height="5" rx="1.5" fill="#d9764a" />
        <rect x="50.5" y="38" width="1.6" height="4" rx="0.8" fill="#7a6a5b" />
        <rect x="57.5" y="38" width="1.6" height="4" rx="0.8" fill="#7a6a5b" />
        <circle cx="51.5" cy="48" r="0.9" fill="#d9764a" />
        <circle cx="55" cy="48" r="0.9" fill="#a9d4e8" />
        <circle cx="58.5" cy="48" r="0.9" fill="#a9d4e8" />
        <circle cx="51.5" cy="52" r="0.9" fill="#a9d4e8" />
        <circle cx="55" cy="52" r="0.9" fill="#a9d4e8" />
        <ellipse cx="26" cy="44" rx="4" ry="2" fill="#ffffff" opacity="0.3" />
        <circle cx="41" cy="56" r="1" fill="#a7dcc4" />

        {/* chore basket, floor corner beside the desk */}
        <ellipse cx="23" cy="116" rx="11" ry="3" fill="#33281f" opacity="0.12" />
        <path d="M14,100 L32,100 L29,116 L17,116 Z" fill="#e9be55" filter="url(#softShadow)" />
        <ellipse cx="23" cy="100" rx="9" ry="2.6" fill="#f6d889" />
        <rect x="17" y="92" width="4" height="8" rx="1.5" fill="#f4b79a" />
        <rect x="22" y="90" width="4" height="10" rx="1.5" fill="#a9d4e8" />
        <rect x="27" y="93" width="4" height="7" rx="1.5" fill="#c9b6e4" />
      </svg>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_50px_rgba(51,40,31,0.08)]"
      />
      <div className="pointer-events-none absolute right-[6%] top-0 h-full w-[22%] bg-gradient-to-b from-yellow/25 via-yellow/5 to-transparent" />
    </>
  );
}
