import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getColorById } from "../data/characterOptions";
import { getRoomZoneSummary } from "../services/getRoomZoneState";
import { getWorkloadOverview } from "../services/getWorkloadOverview";
import { runBurnoutCheck } from "../services/runBurnoutCheck";
import { runCheckInResponse } from "../services/runCheckInResponse";
import { useCharacterStore } from "../store/useCharacterStore";
import { useTaskStore } from "../store/useTaskStore";
import type { Mood } from "../types/checkIn";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type BurnoutCheckResult,
  type Category,
} from "../types/task";
import BuddyCharacter from "../components/characters/BuddyCharacter";
import BuddyIcon from "../components/characters/BuddyIcon";
import DailyCheckInModal from "../components/DailyCheckInModal";
import GoogleSignIn from "../components/GoogleSignIn";
import {
  BellIcon,
  BellOffIcon,
  CameraIcon,
  ChatIcon,
  GearIcon,
  HelpCircleIcon,
  PaletteIcon,
  SparkleIcon,
} from "../components/icons";
import RoomBackdrop from "../components/room/RoomBackdrop";
import ZoneCard from "../components/room/ZoneCard";
import SpeechBubble from "../components/SpeechBubble";
import WorkloadBar from "../components/WorkloadBar";
import WeeklyRecapModal from "../components/WeeklyRecapModal";

function IconButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm transition-colors active:scale-95 sm:h-10 sm:w-10 sm:text-base ${
        active
          ? "border-clay bg-clay-light text-clay-dark"
          : "border-line bg-paper text-ink-soft hover:border-ink-faint hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

// Invisible hitboxes over each piece of furniture, positioned as percentages
// of the room illustration's own 200x120 viewBox (x/200, y/120) — hovering
// one highlights the furniture; clicking opens the task modal for it. The
// buddy character below is positioned the same way (left/bottom percentages
// of this same room box) specifically so its footprint can be reasoned about
// and kept clear of the "people" rect's laptop illustration.
const ZONES: {
  category: Category;
  title: string;
  hint: string;
  rect: { left: string; top: string; width: string; height: string };
}[] = [
  {
    category: "study_work",
    title: "Study/Work",
    hint: "Your study/work area",
    rect: { left: "5%", top: "30%", width: "27%", height: "37%" },
  },
  {
    category: "chores",
    title: "Chores",
    hint: "Do the chores",
    rect: { left: "6%", top: "75%", width: "11%", height: "23%" },
  },
  {
    category: "health",
    title: "Health",
    hint: "Let's be healthy",
    rect: { left: "73%", top: "88%", width: "11%", height: "10%" },
  },
  {
    category: "people",
    title: "People",
    hint: "Let's connect!",
    rect: { left: "52%", top: "80%", width: "14%", height: "13%" },
  },
];

interface RoomPageProps {
  onCustomize: () => void;
}

export default function RoomPage({ onCustomize }: RoomPageProps) {
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
  const [isCheckingBurnout, setIsCheckingBurnout] = useState(false);
  const [burnoutResult, setBurnoutResult] = useState<BurnoutCheckResult | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isFetchingCheckInReply, setIsFetchingCheckInReply] = useState(false);
  const [checkInReply, setCheckInReply] = useState<string | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [isCalendarHovered, setIsCalendarHovered] = useState(false);
  const [activeTip, setActiveTip] = useState<"help" | "settings" | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
  );

  const roomRef = useRef<HTMLDivElement>(null);
  const buddyRef = useRef<HTMLButtonElement>(null);
  const prevZoneStatesRef = useRef<Partial<Record<Category, string>>>({});
  const [bubbleBounds, setBubbleBounds] = useState<{ top: number; maxHeight: number } | null>(
    null,
  );

  const colorOption = getColorById(color);
  const overview = useMemo(() => getWorkloadOverview(tasks), [tasks]);

  // Fires a browser notification only when a zone newly crosses into an
  // overloaded state (cluttered/dim) — tracked via a ref so it doesn't fire
  // again on every re-render while the zone stays overloaded.
  useEffect(() => {
    if (notifPermission !== "granted") return;

    for (const category of CATEGORIES) {
      const summary = getRoomZoneSummary(tasks, category);
      const wasOverloaded =
        prevZoneStatesRef.current[category] === "cluttered" ||
        prevZoneStatesRef.current[category] === "dim";
      const isOverloaded = summary.state === "cluttered" || summary.state === "dim";

      if (isOverloaded && !wasOverloaded) {
        new Notification("Paceful", {
          body:
            summary.state === "dim"
              ? `${CATEGORY_LABELS[category]} has something overdue.`
              : `${CATEGORY_LABELS[category]} is piling up — might be worth a look.`,
        });
      }

      prevZoneStatesRef.current[category] = summary.state;
    }
  }, [tasks, notifPermission]);

  // Measures the room's own height so the ambient speech bubble can be
  // constrained to the band between the top of the room and the buddy —
  // guarantees no overlap with the buddy regardless of viewport size or how
  // much text the bubble holds.
  //
  // Deliberately NOT measured against the calendar hitbox (or any other
  // in-room element) anymore: that made the bubble's available height
  // dependent on wherever the calendar happened to be positioned, so any
  // future move of either element could silently reintroduce an overlap.
  // The calendar now lives low on the wall (see RoomBackdrop.tsx), well
  // outside the vertical range this bubble ever needs for a realistic
  // 2-3 sentence reasoning string — the two are fully decoupled. The
  // buddy-based cap is generous enough that real content always renders at
  // its natural height; the floor below is just a sane minimum for the
  // pathological case of an unexpectedly huge string, so it scrolls
  // instead of rendering as an unusably tiny sliver.
  useLayoutEffect(() => {
    const GAP = 12;
    const recomputeBubbleBounds = () => {
      const room = roomRef.current;
      const buddy = buddyRef.current;
      if (!room || !buddy) return;

      const roomRect = room.getBoundingClientRect();
      const buddyRect = buddy.getBoundingClientRect();

      // Start close to the room's top edge — just enough to clear the
      // rounded corner.
      const top = Math.min(roomRect.height * 0.03, 16);
      const maxHeight = Math.max(96, buddyRect.top - roomRect.top - top - GAP);
      setBubbleBounds({ top, maxHeight });
    };

    recomputeBubbleBounds();
    const observer = new ResizeObserver(recomputeBubbleBounds);
    if (roomRef.current) observer.observe(roomRef.current);
    window.addEventListener("resize", recomputeBubbleBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recomputeBubbleBounds);
    };
  }, [zoom]);

  const handleSnapshot = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 260);
  };

  const handleCheckWorkload = async () => {
    setIsCheckingBurnout(true);
    setBurnoutResult(null);
    try {
      const result = await runBurnoutCheck();
      setBurnoutResult(result);
    } catch (err) {
      console.error("[RoomPage] handleCheckWorkload threw unexpectedly:", err);
    } finally {
      setIsCheckingBurnout(false);
    }
  };

  // Fired by DailyCheckInModal right after the user saves a check-in, so
  // the buddy can respond with something real to how they say they feel —
  // shown in the same speech bubble as the workload check, once the modal
  // closes. Always shows something, even on a Gemini failure, since the
  // user just told the buddy how they feel and silence would read as the
  // buddy ignoring them.
  const handleCheckInSaved = async (mood: Mood, note: string) => {
    setIsFetchingCheckInReply(true);
    setCheckInReply(null);
    try {
      const message = await runCheckInResponse(mood, note);
      setCheckInReply(
        message ?? "Thanks for checking in — take it one step at a time today.",
      );
    } catch (err) {
      console.error("[RoomPage] handleCheckInSaved threw unexpectedly:", err);
      setCheckInReply("Thanks for checking in — take it one step at a time today.");
    } finally {
      setIsFetchingCheckInReply(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  // The buddy always has something to say: the deeper Gemini-backed read
  // (burnout check / check-in reply) takes priority once requested, but it
  // falls back to a locally-computed ambient line so the AI companion never
  // reads as an empty, inert mascot.
  const bubbleText = burnoutResult?.reasoning ?? checkInReply ?? overview.interpretation;
  const bubbleLoading = isCheckingBurnout || isFetchingCheckInReply;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col px-5 py-6 sm:min-h-[calc(100dvh-4rem)] sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-bold leading-none tracking-tight text-clay sm:text-4xl">
              Paceful
            </p>
            <p className="mt-1.5 font-display text-sm font-semibold text-ink-soft sm:text-base">
              {name ? `${name}'s room` : "Your room"}
            </p>
          </div>
          <GoogleSignIn />
        </header>

        {/* control bar — one bordered container instead of icons floating
            loose over the illustration, so the room stays calm and the
            "Check workload" CTA reads as the clear primary action */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-paper-card px-3 py-2.5 shadow-flat sm:px-4 sm:py-3">
          <div className="flex items-center gap-1.5">
            <IconButton label="Customize buddy" onClick={onCustomize}>
              <PaletteIcon className="h-4 w-4" />
            </IconButton>
            <IconButton label="Take a snapshot" onClick={handleSnapshot}>
              <CameraIcon className="h-4 w-4" />
            </IconButton>
          </div>

          <button
            type="button"
            onClick={handleCheckWorkload}
            disabled={isCheckingBurnout}
            aria-label="Check my workload"
            title="Check my workload"
            className="focus-ring order-last flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-clay px-5 font-display text-sm font-semibold text-white shadow-flat transition-transform hover:-translate-y-0.5 hover:bg-clay-dark active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:order-none sm:w-auto sm:flex-1 sm:text-base"
          >
            <ChatIcon className="h-4 w-4" />
            {isCheckingBurnout ? "Checking…" : "Check workload"}
          </button>

          <div className="flex items-center gap-1.5 sm:ml-auto">
            <div className="flex items-center overflow-hidden rounded-full border border-line">
              <button
                type="button"
                aria-label="Zoom out"
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}
                className="focus-ring flex h-9 w-8 items-center justify-center text-ink-soft hover:bg-line-soft hover:text-ink sm:h-10"
              >
                −
              </button>
              <span className="h-5 w-px bg-line" aria-hidden="true" />
              <button
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))}
                className="focus-ring flex h-9 w-8 items-center justify-center text-ink-soft hover:bg-line-soft hover:text-ink sm:h-10"
              >
                +
              </button>
            </div>
            {notifPermission !== "unsupported" && (
              <IconButton
                label={
                  notifPermission === "granted"
                    ? "Overload alerts on"
                    : notifPermission === "denied"
                      ? "Notifications blocked in browser settings"
                      : "Enable overload alerts"
                }
                onClick={handleEnableNotifications}
              >
                {notifPermission === "granted" ? (
                  <BellIcon className="h-4 w-4" />
                ) : (
                  <BellOffIcon className="h-4 w-4" />
                )}
              </IconButton>
            )}
            <IconButton
              label="Help"
              active={activeTip === "help"}
              onClick={() => setActiveTip((t) => (t === "help" ? null : "help"))}
            >
              <HelpCircleIcon className="h-4 w-4" />
            </IconButton>
            <IconButton
              label="Settings"
              active={activeTip === "settings"}
              onClick={() => setActiveTip((t) => (t === "settings" ? null : "settings"))}
            >
              <GearIcon className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <AnimatePresence>
          {activeTip && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="-mt-1 mb-3 overflow-hidden rounded-xl bg-line-soft px-3.5 py-2 text-xs text-ink-soft sm:text-sm"
            >
              {activeTip === "help"
                ? "Tap any part of the room to add a task for that area, or tap your buddy for a daily check-in."
                : "Account and notification preferences are coming soon — for now, notifications live in the bell icon."}
            </motion.p>
          )}
        </AnimatePresence>

        {/* room area — targets roughly 2/3 of the page's available height */}
        <div className="flex flex-[3] items-center justify-center overflow-hidden sm:flex-[2]">
          <div
            ref={roomRef}
            className="relative aspect-[4/5] max-h-full w-full overflow-hidden rounded-[2.5rem] border border-line bg-paper-card shadow-[0_20px_60px_rgba(51,40,31,0.12)] sm:aspect-[16/9]"
          >
            <RoomBackdrop />

            {ZONES.map(({ category, title, hint, rect }) => (
              <motion.button
                key={category}
                type="button"
                aria-label={`${title} — ${hint}. Tap to check status and add a task`}
                onMouseEnter={() => setHoveredZone(category)}
                onMouseLeave={() => setHoveredZone((z) => (z === category ? null : z))}
                onFocus={() => setHoveredZone(category)}
                onBlur={() => setHoveredZone((z) => (z === category ? null : z))}
                onClick={() => openTaskModal(category)}
                animate={
                  hoveredZone === category
                    ? { opacity: 1 }
                    : { opacity: [0.35, 0.8, 0.35] }
                }
                transition={
                  hoveredZone === category
                    ? { duration: 0.15 }
                    : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                }
                className={`focus-ring absolute flex items-start justify-center rounded-2xl ring-2 transition-colors ${
                  hoveredZone === category
                    ? "bg-white/20 ring-white/70"
                    : "bg-white/5 ring-white/35"
                }`}
                style={rect}
              >
                <span
                  className={`pointer-events-none mt-1 w-max max-w-[6.5rem] whitespace-normal text-balance rounded-xl border border-line bg-paper-card/95 px-2 py-1 text-center font-display text-[0.55rem] font-semibold leading-tight text-ink shadow-sm transition-opacity sm:max-w-none sm:whitespace-nowrap sm:rounded-full sm:text-[0.65rem] ${
                    hoveredZone === category ? "opacity-100" : "opacity-85"
                  }`}
                >
                  {hint}
                </span>
              </motion.button>
            ))}

            <motion.button
              type="button"
              aria-label="Weekly recap — see how your week's been going"
              onMouseEnter={() => setIsCalendarHovered(true)}
              onMouseLeave={() => setIsCalendarHovered(false)}
              onFocus={() => setIsCalendarHovered(true)}
              onBlur={() => setIsCalendarHovered(false)}
              onClick={() => setShowRecap(true)}
              animate={
                isCalendarHovered
                  ? { opacity: 1 }
                  : { opacity: [0.55, 0.9, 0.55] }
              }
              transition={
                isCalendarHovered
                  ? { duration: 0.15 }
                  : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              }
              className={`focus-ring absolute flex items-end justify-center rounded-xl ring-2 ${
                isCalendarHovered ? "bg-white/20 ring-white/70" : "bg-white/10 ring-white/40"
              }`}
              style={{ left: "44%", top: "38.3%", width: "7%", height: "13.3%" }}
            >
              <span
                className={`pointer-events-none mb-1 w-max max-w-[6.5rem] whitespace-normal text-balance rounded-xl border border-line bg-paper-card/95 px-2 py-1 text-center font-display text-[0.55rem] font-semibold leading-tight text-ink shadow-sm transition-opacity sm:max-w-none sm:whitespace-nowrap sm:rounded-full sm:text-[0.65rem] ${
                  isCalendarHovered ? "opacity-100" : "opacity-85"
                }`}
              >
                See your week
              </span>
            </motion.button>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
            >
              <div
                className="h-[46%] w-[36%] rounded-full opacity-40 blur-3xl"
                style={{ backgroundColor: colorOption.hex }}
              />
            </div>

            {/* Buddy is positioned with the same left/bottom-percentage
                system as the zone hitboxes above (rather than flex-centered)
                so its footprint can be reasoned about directly: at 22% wide,
                left-anchored at 27%, it spans x:27%-49% — clear of the
                "people" zone's laptop, which sits at x:52%-66%. Left edge is
                set directly (not centered via a translate-x class) because
                framer-motion's animate/whileTap own the element's inline
                transform and would silently override a CSS transform class
                applied for centering. */}
            <div className="pointer-events-none absolute inset-0">
              <motion.button
                ref={buddyRef}
                type="button"
                onClick={() => setShowCheckIn(true)}
                aria-label="Tap your buddy for a daily check-in"
                animate={{ scale: zoom }}
                whileTap={{ scale: zoom * 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ left: "27%", bottom: "10%" }}
                className="focus-ring pointer-events-auto absolute h-[22%] w-[22%] cursor-pointer"
              >
                <BuddyCharacter
                  baseId={baseId}
                  colorId={color}
                  accessoryId={accessoryId}
                  className="h-full w-full"
                />
              </motion.button>
            </div>

            {/* Ambient AI companion — always has something to say (see
                bubbleText above), so it never reads as an inert mascot; it
                just gets a deeper answer once the student actually asks. */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={
                bubbleBounds
                  ? { top: bubbleBounds.top, maxHeight: bubbleBounds.maxHeight }
                  : undefined
              }
              className="pointer-events-none absolute inset-x-0 flex justify-center overflow-y-auto px-[3%]"
            >
              <SpeechBubble isLoading={bubbleLoading} text={bubbleText} />
            </motion.div>

            <div className="pointer-events-none absolute bottom-[1%] left-1/2 max-w-[45%] -translate-x-1/2 truncate rounded-full border border-line bg-paper-card px-3 py-1 font-display text-xs font-semibold text-ink shadow-sm sm:px-4 sm:py-1.5 sm:text-sm">
              {name || "Buddy"}&rsquo;s Room
            </div>

            <div className="pointer-events-none absolute bottom-[1%] left-[2%] max-w-[25%] truncate rounded-full border border-line bg-paper-card/90 px-2 py-1 font-display text-[0.65rem] font-semibold capitalize text-ink shadow-sm sm:px-3 sm:py-1.5 sm:text-xs">
              Feeling {mood}
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
        </div>

        {/* below the room — workload summary, section 2 of the design spec */}
        <div className="mt-5 flex flex-[1] flex-col gap-3">
          {burnoutResult && !isCheckingBurnout && (
            <div className="rounded-2xl border border-clay-light bg-clay-light/25 p-4">
              <div className="flex items-center gap-1.5 text-clay-dark">
                <SparkleIcon className="h-4 w-4" />
                <span className="font-display text-xs font-bold uppercase tracking-wide">
                  AI insight
                </span>
              </div>
              <p className="mt-1.5 text-sm text-ink">
                Overloaded zone:{" "}
                <span className="font-semibold text-ink">
                  {burnoutResult.overloadedCategory
                    ? CATEGORY_LABELS[burnoutResult.overloadedCategory]
                    : "None right now"}
                </span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Urgent:</span>{" "}
                {burnoutResult.urgentTaskIds.length === 0
                  ? "none"
                  : burnoutResult.urgentTaskIds
                      .map((id) => tasks.find((task) => task.id === id)?.title ?? `unknown:${id}`)
                      .join(", ")}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Non-urgent:</span>{" "}
                {burnoutResult.nonUrgentTaskIds.length === 0
                  ? "none"
                  : burnoutResult.nonUrgentTaskIds
                      .map((id) => tasks.find((task) => task.id === id)?.title ?? `unknown:${id}`)
                      .join(", ")}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-paper-card p-4 shadow-flat sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-sm font-semibold text-ink sm:text-base">
                Overall workload
              </span>
              <span className="font-display text-lg font-bold text-ink sm:text-xl">
                {overview.overallPercent}%
              </span>
            </div>
            <div className="mt-2.5">
              <WorkloadBar percent={overview.overallPercent} size="lg" />
            </div>
            <div className="mt-3 flex items-start gap-2">
              <BuddyIcon
                baseId={baseId}
                fill={colorOption.hex}
                shade={colorOption.shadeHex}
                className="h-6 w-6 shrink-0"
              />
              <p className="text-sm leading-snug text-ink-soft">{overview.interpretation}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {overview.categories.map((summary) => {
              const zone = ZONES.find((z) => z.category === summary.category)!;
              return (
                <ZoneCard
                  key={summary.category}
                  category={summary.category}
                  title={zone.title}
                  state={summary.state}
                  loadPercent={summary.loadPercent}
                  activeCount={summary.activeCount}
                  overdueCount={summary.overdueCount}
                  onClick={() => openTaskModal(summary.category)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCheckIn && (
          <DailyCheckInModal
            key="checkin"
            onClose={() => setShowCheckIn(false)}
            onSaved={handleCheckInSaved}
          />
        )}
        {showRecap && <WeeklyRecapModal key="recap" onClose={() => setShowRecap(false)} />}
      </AnimatePresence>
    </div>
  );
}
