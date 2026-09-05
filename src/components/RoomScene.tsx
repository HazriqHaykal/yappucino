import { AnimatePresence, motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { getColorById } from "../data/characterOptions";
import { getRoomZoneSummary } from "../services/getRoomZoneState";
import { runBurnoutCheck } from "../services/runBurnoutCheck";
import { useCharacterStore } from "../store/useCharacterStore";
import { useTaskStore } from "../store/useTaskStore";
import { CATEGORY_LABELS, type BurnoutCheckResult, type Category } from "../types/task";
import BuddyCharacter from "./characters/BuddyCharacter";
import RoomBackdrop from "./room/RoomBackdrop";
import ZoneCard from "./room/ZoneCard";
import SpeechBubble from "./SpeechBubble";
import TaskBoard from "./TaskBoard";

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  tired: "🥱",
  excited: "🤩",
};

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-card text-base shadow-[0_8px_20px_rgba(51,40,31,0.1)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
    >
      {children}
    </button>
  );
}

// Invisible hitboxes over each piece of furniture, positioned as percentages
// of the room illustration's own 200x120 viewBox (x/200, y/120) — hovering
// one highlights the furniture; clicking opens the task modal for it. The
// side-column cards are connected to their hitbox by a measured line (see
// useLayoutEffect below), not a fixed arrow, so it always points at the
// right spot regardless of card size or window width.
const ZONES: {
  category: Category;
  title: string;
  rect: { left: string; top: string; width: string; height: string };
  side: "left" | "right";
}[] = [
  {
    category: "study_work",
    title: "Study/Work",
    rect: { left: "5%", top: "30%", width: "27%", height: "37%" },
    side: "left",
  },
  {
    category: "chores",
    title: "Chores",
    rect: { left: "6%", top: "75%", width: "11%", height: "23%" },
    side: "left",
  },
  {
    category: "health",
    title: "Health",
    rect: { left: "73%", top: "88%", width: "11%", height: "10%" },
    side: "right",
  },
  {
    category: "people",
    title: "People",
    rect: { left: "52%", top: "80%", width: "14%", height: "13%" },
    side: "right",
  },
];

interface ConnectorLine {
  category: Category;
  d: string;
}

export default function RoomScene() {
  const tasks = useTaskStore((state) => state.tasks);
  const openTaskModal = useTaskStore((state) => state.openTaskModal);
  const name = useCharacterStore((state) => state.name);
  const baseId = useCharacterStore((state) => state.baseId);
  const color = useCharacterStore((state) => state.color);
  const accessoryId = useCharacterStore((state) => state.accessoryId);
  const mood = useCharacterStore((state) => state.mood);

  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<Category | null>(null);
  const [lines, setLines] = useState<ConnectorLine[]>([]);
  const [isCheckingBurnout, setIsCheckingBurnout] = useState(false);
  const [burnoutResult, setBurnoutResult] = useState<BurnoutCheckResult | null>(null);

  const rowRef = useRef<HTMLDivElement>(null);
  const hitboxRefs = useRef<Partial<Record<Category, HTMLButtonElement>>>({});
  const cardRefs = useRef<Partial<Record<Category, HTMLDivElement>>>({});

  const colorOption = getColorById(color);

  const leftZones = ZONES.filter((z) => z.side === "left");
  const rightZones = ZONES.filter((z) => z.side === "right");

  // Measures the real on-screen position of each card and its hitbox, then
  // draws a curved connector between them — recomputed on resize so it
  // stays accurate instead of a fixed arrow glyph that doesn't track them.
  useLayoutEffect(() => {
    const recompute = () => {
      const row = rowRef.current;
      if (!row || window.innerWidth < 1280) {
        setLines([]);
        return;
      }
      const rowRect = row.getBoundingClientRect();
      const next: ConnectorLine[] = [];

      for (const zone of ZONES) {
        const hitbox = hitboxRefs.current[zone.category];
        const card = cardRefs.current[zone.category];
        if (!hitbox || !card) continue;

        const hRect = hitbox.getBoundingClientRect();
        const cRect = card.getBoundingClientRect();

        const x2 = hRect.left + hRect.width / 2 - rowRect.left;
        const y2 = hRect.top + hRect.height / 2 - rowRect.top;
        const x1 = (zone.side === "left" ? cRect.right : cRect.left) - rowRect.left;
        const y1 = cRect.top + cRect.height / 2 - rowRect.top;

        const dx = (x2 - x1) * 0.55;
        next.push({
          category: zone.category,
          d: `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`,
        });
      }

      setLines(next);
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    if (rowRef.current) observer.observe(rowRef.current);
    window.addEventListener("resize", recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [tasks]);

  const handleSnapshot = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 260);
  };

  const handleTapBuddy = async () => {
    setIsCheckingBurnout(true);
    setBurnoutResult(null);
    const result = await runBurnoutCheck();
    setBurnoutResult(result);
    setIsCheckingBurnout(false);
  };

  const goToCustomize = () => {
    window.location.search = "?screen=character";
  };

  return (
    <div className="min-h-screen px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-[1680px]">
        <header className="mb-8 text-center">
          <p className="font-display text-xs font-bold tracking-[0.24em] text-clay uppercase">
            Paceful
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
            {name ? `${name}'s room` : "Your room"}
          </h1>
          <p className="mt-2 text-base text-ink-soft">
            Each card points to the zone it's tracking.
          </p>
        </header>

        <div ref={rowRef} className="relative flex items-stretch gap-4 xl:gap-6">
          {/* left status cards — desktop only, room falls back to the grid below on smaller screens */}
          <div className="hidden w-72 shrink-0 flex-col justify-between py-2 xl:flex">
            {leftZones.map(({ category, title }) => {
              const summary = getRoomZoneSummary(tasks, category);
              return (
                <div
                  key={category}
                  ref={(el) => {
                    cardRefs.current[category] = el ?? undefined;
                  }}
                >
                  <ZoneCard
                    title={title}
                    subtitle={CATEGORY_LABELS[category]}
                    state={summary.state}
                    loadPercent={summary.loadPercent}
                    onClick={() => openTaskModal(category)}
                  />
                </div>
              );
            })}
          </div>

          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2.5rem] border border-line bg-paper-card shadow-[0_20px_60px_rgba(51,40,31,0.12)]">
            <RoomBackdrop />

            {ZONES.map(({ category, title, rect }) => (
              <button
                key={category}
                type="button"
                ref={(el) => {
                  hitboxRefs.current[category] = el ?? undefined;
                }}
                aria-label={`${title} — check status and add a task`}
                onMouseEnter={() => setHoveredZone(category)}
                onMouseLeave={() => setHoveredZone((z) => (z === category ? null : z))}
                onFocus={() => setHoveredZone(category)}
                onBlur={() => setHoveredZone((z) => (z === category ? null : z))}
                onClick={() => openTaskModal(category)}
                className={`focus-ring absolute rounded-2xl transition-colors ${
                  hoveredZone === category
                    ? "bg-white/20 ring-2 ring-white/70"
                    : "bg-transparent"
                }`}
                style={rect}
              />
            ))}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
            >
              <div
                className="h-[46%] w-[36%] rounded-full opacity-40 blur-3xl"
                style={{ backgroundColor: colorOption.hex }}
              />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-[10%] flex justify-center">
              <motion.button
                type="button"
                onClick={handleTapBuddy}
                aria-label="Tap your buddy for a check-in"
                animate={{ scale: zoom }}
                whileTap={{ scale: zoom * 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="focus-ring pointer-events-auto h-[30%] w-[30%] cursor-pointer sm:h-[28%] sm:w-[28%]"
              >
                <BuddyCharacter
                  baseId={baseId}
                  colorId={color}
                  accessoryId={accessoryId}
                  className="h-full w-full"
                />
              </motion.button>
            </div>

            <AnimatePresence>
              {(isCheckingBurnout || burnoutResult) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="pointer-events-none absolute inset-x-0 bottom-[48%] flex justify-center px-6"
                >
                  <SpeechBubble
                    isLoading={isCheckingBurnout}
                    text={burnoutResult?.reasoning ?? null}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-paper-card px-4 py-1.5 font-display text-sm font-semibold text-ink shadow-sm">
              {name || "Buddy"}&rsquo;s Room
            </div>

            <div className="absolute left-4 top-4 flex gap-2">
              <IconButton label="Customize buddy" onClick={goToCustomize}>
                🎨
              </IconButton>
              <IconButton label="Take a snapshot" onClick={handleSnapshot}>
                📸
              </IconButton>
            </div>

            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <IconButton
                label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))}
              >
                +
              </IconButton>
              <IconButton
                label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}
              >
                −
              </IconButton>
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border border-line bg-paper-card/90 px-3 py-1.5 font-display text-xs font-semibold text-ink shadow-sm">
              <span>{MOOD_EMOJI[mood] ?? MOOD_EMOJI.happy}</span>
              <span className="capitalize">{mood}</span>
            </div>

            <AnimatePresence>
              {flash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.13 }}
                  className="pointer-events-none absolute inset-0 bg-white"
                />
              )}
            </AnimatePresence>
          </div>

          {/* right status cards — desktop only */}
          <div className="hidden w-72 shrink-0 flex-col justify-between py-2 xl:flex">
            {rightZones.map(({ category, title }) => {
              const summary = getRoomZoneSummary(tasks, category);
              return (
                <div
                  key={category}
                  ref={(el) => {
                    cardRefs.current[category] = el ?? undefined;
                  }}
                >
                  <ZoneCard
                    title={title}
                    subtitle={CATEGORY_LABELS[category]}
                    state={summary.state}
                    loadPercent={summary.loadPercent}
                    onClick={() => openTaskModal(category)}
                  />
                </div>
              );
            })}
          </div>

          {/* connector lines from each card to the exact hitbox it describes */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden h-full w-full xl:block"
          >
            <defs>
              <marker
                id="zone-pointer"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#a6957f" />
              </marker>
            </defs>
            {lines.map((line) => (
              <path
                key={line.category}
                d={line.d}
                fill="none"
                stroke="#a6957f"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#zone-pointer)"
              />
            ))}
          </svg>
        </div>

        {burnoutResult && !isCheckingBurnout && (
          <div className="mt-4 rounded-2xl border border-line bg-paper-card p-4 text-sm shadow-flat">
            <p className="font-display font-semibold text-ink">
              Overloaded zone:{" "}
              <span className="font-normal text-ink-soft">
                {burnoutResult.overloadedCategory
                  ? CATEGORY_LABELS[burnoutResult.overloadedCategory]
                  : "None right now"}
              </span>
            </p>
            <p className="mt-1 text-ink-soft">
              <span className="font-semibold text-ink">Urgent:</span>{" "}
              {burnoutResult.urgentTaskIds.length === 0
                ? "none"
                : burnoutResult.urgentTaskIds
                    .map((id) => tasks.find((task) => task.id === id)?.title ?? `unknown:${id}`)
                    .join(", ")}
            </p>
            <p className="mt-1 text-ink-soft">
              <span className="font-semibold text-ink">Non-urgent:</span>{" "}
              {burnoutResult.nonUrgentTaskIds.length === 0
                ? "none"
                : burnoutResult.nonUrgentTaskIds
                    .map((id) => tasks.find((task) => task.id === id)?.title ?? `unknown:${id}`)
                    .join(", ")}
            </p>
          </div>
        )}

        {/* status cards fall back to a plain grid below the room on narrower screens */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:hidden">
          {ZONES.map(({ category, title }) => {
            const summary = getRoomZoneSummary(tasks, category);
            return (
              <ZoneCard
                key={category}
                title={title}
                subtitle={CATEGORY_LABELS[category]}
                state={summary.state}
                loadPercent={summary.loadPercent}
                onClick={() => openTaskModal(category)}
              />
            );
          })}
        </div>

        <TaskBoard />
      </div>
    </div>
  );
}
