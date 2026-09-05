import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { getColorById } from "../data/characterOptions";
import { getRoomZoneSummary } from "../services/getRoomZoneState";
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
import DailyCheckInModal from "../components/DailyCheckInModal";
import GoogleSignIn from "../components/GoogleSignIn";
import { BellIcon, BellOffIcon, CameraIcon, ChatIcon, PaletteIcon } from "../components/icons";
import RoomBackdrop from "../components/room/RoomBackdrop";
import ZoneCard from "../components/room/ZoneCard";
import SpeechBubble from "../components/SpeechBubble";
import WeeklyRecapModal from "../components/WeeklyRecapModal";

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper-card text-sm text-ink-soft shadow-[0_8px_20px_rgba(51,40,31,0.1)] transition-transform hover:-translate-y-0.5 hover:text-ink active:translate-y-0 active:scale-95 sm:h-10 sm:w-10 sm:text-base"
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
  rect: { left: string; top: string; width: string; height: string };
}[] = [
  {
    category: "study_work",
    title: "Study/Work",
    rect: { left: "5%", top: "30%", width: "27%", height: "37%" },
  },
  {
    category: "chores",
    title: "Chores",
    rect: { left: "6%", top: "75%", width: "11%", height: "23%" },
  },
  {
    category: "health",
    title: "Health",
    rect: { left: "73%", top: "88%", width: "11%", height: "10%" },
  },
  {
    category: "people",
    title: "People",
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
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
  );

  const roomRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const buddyRef = useRef<HTMLButtonElement>(null);
  const prevZoneStatesRef = useRef<Partial<Record<Category, string>>>({});
  const [bubbleBounds, setBubbleBounds] = useState<{ top: number; maxHeight: number } | null>(
    null,
  );

  const colorOption = getColorById(color);

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

  // Measures the actual gap between the toolbar and the buddy so the speech
  // bubble can be constrained to that exact band — guarantees no overlap
  // regardless of viewport size or how much text the bubble holds, instead
  // of guessing at a fixed percentage that only happens to work at one
  // screen size.
  useLayoutEffect(() => {
    const GAP = 12;
    const recomputeBubbleBounds = () => {
      const room = roomRef.current;
      const toolbar = toolbarRef.current;
      const buddy = buddyRef.current;
      if (!room || !toolbar || !buddy) return;

      const roomRect = room.getBoundingClientRect();
      const toolbarRect = toolbar.getBoundingClientRect();
      const buddyRect = buddy.getBoundingClientRect();

      const top = toolbarRect.bottom - roomRect.top + GAP;
      const maxHeight = Math.max(40, buddyRect.top - roomRect.top - top - GAP);
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

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col px-5 py-6 sm:min-h-[calc(100dvh-4rem)] sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col">
        <header className="relative mb-4 text-center">
          <div className="absolute right-0 top-0">
            <GoogleSignIn />
          </div>
          <p className="font-display text-xs font-bold tracking-[0.24em] text-clay uppercase">
            Paceful
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
            {name ? `${name}'s room` : "Your room"}
          </h1>
        </header>

        {/* room area — targets roughly 2/3 of the page's available height */}
        <div className="flex flex-[2] items-center justify-center overflow-hidden">
          <div
            ref={roomRef}
            className="relative aspect-[4/5] max-h-full w-full overflow-hidden rounded-[2.5rem] border border-line bg-paper-card shadow-[0_20px_60px_rgba(51,40,31,0.12)] sm:aspect-[16/9]"
          >
            <RoomBackdrop />

            {ZONES.map(({ category, title, rect }) => (
              <button
                key={category}
                type="button"
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
              className={`focus-ring absolute rounded-xl ring-2 ${
                isCalendarHovered ? "bg-white/20 ring-white/70" : "bg-white/10 ring-white/40"
              }`}
              style={{ left: "44%", top: "15%", width: "7%", height: "13.3%" }}
            />

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

            <AnimatePresence>
              {(isCheckingBurnout ||
                burnoutResult ||
                isFetchingCheckInReply ||
                checkInReply) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  style={
                    bubbleBounds
                      ? { top: bubbleBounds.top, maxHeight: bubbleBounds.maxHeight }
                      : undefined
                  }
                  className="pointer-events-none absolute inset-x-0 flex justify-center overflow-y-auto px-[3%]"
                >
                  <SpeechBubble
                    isLoading={isCheckingBurnout || isFetchingCheckInReply}
                    text={burnoutResult?.reasoning ?? checkInReply ?? null}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pointer-events-none absolute bottom-[1%] left-1/2 max-w-[45%] -translate-x-1/2 truncate rounded-full border border-line bg-paper-card px-3 py-1 font-display text-xs font-semibold text-ink shadow-sm sm:px-4 sm:py-1.5 sm:text-sm">
              {name || "Buddy"}&rsquo;s Room
            </div>

            <div
              ref={toolbarRef}
              className="absolute left-[3%] right-[3%] top-[3%] flex flex-wrap items-center gap-1.5 sm:gap-2"
            >
              <IconButton label="Customize buddy" onClick={onCustomize}>
                <PaletteIcon className="h-4 w-4" />
              </IconButton>
              <IconButton label="Take a snapshot" onClick={handleSnapshot}>
                <CameraIcon className="h-4 w-4" />
              </IconButton>
              <button
                type="button"
                onClick={handleCheckWorkload}
                disabled={isCheckingBurnout}
                aria-label="Check my workload"
                title="Check my workload"
                className="focus-ring flex h-9 items-center gap-1.5 rounded-full bg-clay px-3 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(51,40,31,0.1)] transition-transform hover:-translate-y-0.5 hover:bg-clay-dark active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-sm"
              >
                <ChatIcon className="h-4 w-4" />
                {isCheckingBurnout ? "Checking…" : "Check workload"}
              </button>
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
            </div>

            <div className="absolute right-[3%] top-[3%] flex flex-col gap-1.5 sm:gap-2">
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

        {/* below the room — targets roughly the remaining 1/3 of the page's
            available height */}
        <div className="mt-4 flex flex-[1] flex-col gap-3 overflow-y-auto">
          {burnoutResult && !isCheckingBurnout && (
            <div className="rounded-2xl border border-line bg-paper-card p-4 text-sm shadow-flat">
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

          <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4">
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
