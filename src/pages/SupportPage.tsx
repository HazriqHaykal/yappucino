import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { getRecentCheckIns } from "../services/checkIn";
import { getWorkloadOverview } from "../services/getWorkloadOverview";
import { runTherapyNudge } from "../services/runTherapyNudge";
import { useAuthStore } from "../store/useAuthStore";
import { useCharacterStore } from "../store/useCharacterStore";
import { useTaskStore } from "../store/useTaskStore";
import { useTherapyStore } from "../store/useTherapyStore";
import { CATEGORY_LABELS } from "../types/task";
import type { Tab } from "../components/NavBar";
import BuddyCharacter from "../components/characters/BuddyCharacter";
import PageHeader from "../components/PageHeader";
import TherapySuggestionCard from "../components/TherapySuggestionCard";
import {
  BreathIcon,
  ChatIcon,
  ClipboardIcon,
  LeafIcon,
  MindfulnessIcon,
  NeutralFaceIcon,
  OverwhelmedFaceIcon,
  ScreenOffIcon,
  SmileFaceIcon,
  SparkleIcon,
  StressedFaceIcon,
  StretchIcon,
  TiredFaceIcon,
  UsersIcon,
  WaterDropIcon,
} from "../components/icons";

const RECENT_DAYS = 7;
const STRESS_COUNT_THRESHOLD = 2;

type SupportMood = "good" | "okay" | "tired" | "stressed" | "overwhelmed";

const MOOD_OPTIONS: { id: SupportMood; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "good", label: "Good", icon: SmileFaceIcon },
  { id: "okay", label: "Okay", icon: NeutralFaceIcon },
  { id: "tired", label: "Tired", icon: TiredFaceIcon },
  { id: "stressed", label: "Stressed", icon: StressedFaceIcon },
  { id: "overwhelmed", label: "Overwhelmed", icon: OverwhelmedFaceIcon },
];

interface ResetActivity {
  id: string;
  title: string;
  focusTitle: string;
  icon: ComponentType<{ className?: string }>;
  durationSec: number;
  durationLabel: string;
  instructions: string[];
}

const RESET_ACTIVITIES: ResetActivity[] = [
  {
    id: "breathing",
    title: "Breathing",
    focusTitle: "Take a breath",
    icon: BreathIcon,
    durationSec: 180,
    durationLabel: "3 min",
    instructions: ["Slowly breathe in…", "Hold…", "Slowly breathe out…"],
  },
  {
    id: "stretch",
    title: "Stretch",
    focusTitle: "Take a stretch",
    icon: StretchIcon,
    durationSec: 120,
    durationLabel: "2 min",
    instructions: [
      "Reach your arms up and stretch.",
      "Roll your shoulders back, slowly.",
      "Gently stretch your neck side to side.",
    ],
  },
  {
    id: "water",
    title: "Drink water",
    focusTitle: "Drink some water",
    icon: WaterDropIcon,
    durationSec: 60,
    durationLabel: "1 min",
    instructions: ["Grab a glass of water.", "Take a few slow sips."],
  },
  {
    id: "screen",
    title: "Step away from your screen",
    focusTitle: "Step away for a moment",
    icon: ScreenOffIcon,
    durationSec: 180,
    durationLabel: "3 min",
    instructions: [
      "Look away from your screen.",
      "Let your eyes rest on something far away.",
      "Take a few slow breaths.",
    ],
  },
  {
    id: "mindfulness",
    title: "Short mindfulness exercise",
    focusTitle: "Take a mindful pause",
    icon: MindfulnessIcon,
    durationSec: 180,
    durationLabel: "3 min",
    instructions: [
      "Notice five things you can see.",
      "Notice four things you can hear.",
      "Notice how your body feels right now.",
    ],
  },
];

// Breathing gets its own phase-synced loop (instead of the generic
// instruction rotation every other activity uses) so the visual and the
// "breathe in / hold / breathe out" text change at exactly the same moment.
const BREATH_PHASES: { label: string; durationMs: number; scale: number }[] = [
  { label: "Slowly breathe in…", durationMs: 4000, scale: 1.35 },
  { label: "Hold…", durationMs: 2000, scale: 1.35 },
  { label: "Slowly breathe out…", durationMs: 4000, scale: 0.82 },
];

const ACTIVITY_VISUAL_STYLE: Record<string, { bg: string; ring: string; text: string }> = {
  breathing: { bg: "bg-mint/25", ring: "bg-mint-shade/70", text: "text-mint-shade" },
  stretch: { bg: "bg-peach/25", ring: "bg-peach-shade/70", text: "text-peach-shade" },
  water: { bg: "bg-sky/25", ring: "bg-sky-shade/70", text: "text-sky-shade" },
  screen: { bg: "bg-lavender/25", ring: "bg-lavender-shade/70", text: "text-lavender-shade" },
  mindfulness: { bg: "bg-yellow/25", ring: "bg-yellow-shade/70", text: "text-yellow-shade" },
};

// A small looping animation per activity — breathing scales in sync with
// BREATH_PHASES (passed in via breathPhase); everything else is a gentle,
// self-contained infinite loop that just needs to read as "alive."
function ResetVisual({
  activity,
  breathPhase,
}: {
  activity: ResetActivity;
  breathPhase: (typeof BREATH_PHASES)[number];
}) {
  const style = ACTIVITY_VISUAL_STYLE[activity.id] ?? ACTIVITY_VISUAL_STYLE.breathing;
  const Icon = activity.icon;

  if (activity.id === "breathing") {
    return (
      <motion.div
        animate={{ scale: breathPhase.scale }}
        transition={{ duration: breathPhase.durationMs / 1000, ease: "easeInOut" }}
        className={`flex h-28 w-28 items-center justify-center rounded-full ${style.bg}`}
      >
        <div className={`h-16 w-16 rounded-full ${style.ring}`} />
      </motion.div>
    );
  }

  if (activity.id === "mindfulness") {
    return (
      <div className="relative flex h-28 w-28 items-center justify-center">
        <motion.span
          animate={{ scale: [1, 1.7], opacity: [0.45, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
          className={`absolute h-16 w-16 rounded-full ${style.ring}`}
        />
        <span className={`relative flex h-16 w-16 items-center justify-center rounded-full ${style.bg}`}>
          <Icon className={`h-8 w-8 ${style.text}`} />
        </span>
      </div>
    );
  }

  if (activity.id === "water") {
    return (
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className={`flex h-28 w-28 items-center justify-center rounded-full ${style.bg}`}
      >
        <Icon className={`h-14 w-14 ${style.text}`} />
      </motion.div>
    );
  }

  if (activity.id === "screen") {
    return (
      <motion.div
        animate={{ opacity: [1, 0.45, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={`flex h-28 w-28 items-center justify-center rounded-full ${style.bg}`}
      >
        <Icon className={`h-14 w-14 ${style.text}`} />
      </motion.div>
    );
  }

  // stretch — a small reach-up bounce
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={`flex h-28 w-28 items-center justify-center rounded-full ${style.bg}`}
    >
      <Icon className={`h-14 w-14 ${style.text}`} />
    </motion.div>
  );
}

type NeedId = "calm" | "talk" | "break" | "overwhelmed";

const NEED_CARDS: {
  id: NeedId;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "calm", title: "Calm down", description: "I need a moment to settle down.", icon: BreathIcon },
  { id: "talk", title: "Talk", description: "I want someone to listen.", icon: ChatIcon },
  { id: "break", title: "Take a break", description: "I need to step away for a while.", icon: LeafIcon },
  {
    id: "overwhelmed",
    title: "Work feels overwhelming",
    description: "I don't know where to start.",
    icon: ClipboardIcon,
  },
];

const COMMUNITY_HIGHLIGHTS = [
  "12 students studying around Faculty of Computing",
  "5 students taking a break near campus park",
  "3 students doing a group study session",
  "8 students walking around campus",
];

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

interface SupportPageProps {
  onNavigate: (tab: Tab) => void;
}

export default function SupportPage({ onNavigate }: SupportPageProps) {
  const user = useAuthStore((state) => state.user);
  const tasks = useTaskStore((state) => state.tasks);
  const baseId = useCharacterStore((state) => state.baseId);
  const color = useCharacterStore((state) => state.color);
  const accessoryId = useCharacterStore((state) => state.accessoryId);

  const therapySuggestions = useTherapyStore((state) => state.suggestions);
  const markTherapySuggestionContacted = useTherapyStore(
    (state) => state.markTherapySuggestionContacted,
  );

  const [selectedMood, setSelectedMood] = useState<SupportMood | null>(null);
  const [stressDetected, setStressDetected] = useState(false);

  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isResetComplete, setIsResetComplete] = useState(false);
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);

  const [activeNeed, setActiveNeed] = useState<NeedId | null>(null);
  const [showResources, setShowResources] = useState(false);

  const [isFetchingSupport, setIsFetchingSupport] = useState(false);
  const [hasSearchedSupport, setHasSearchedSupport] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);

  const resetSectionRef = useRef<HTMLDivElement>(null);
  const professionalSectionRef = useRef<HTMLDivElement>(null);

  const overview = useMemo(() => getWorkloadOverview(tasks), [tasks]);
  const studyWorkSummary = overview.categories.find((c) => c.category === "study_work")!;

  const urgentStudyTask = useMemo(
    () =>
      tasks
        .filter((t) => t.category === "study_work" && t.status === "active")
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
          const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
          const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
          return aDue - bDue;
        })[0],
    [tasks],
  );

  // Same recent-check-in stress signal the old Therapy tab used — folded in
  // here as a fallback for the AI buddy's message when the student hasn't
  // picked a mood on this page yet.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setStressDetected(false);
      return;
    }
    (async () => {
      const checkIns = await getRecentCheckIns(user.id, RECENT_DAYS);
      if (cancelled) return;
      const stressCount = checkIns.filter((c) => c.mood === "stress").length;
      const latestIsStressed = checkIns[0]?.mood === "stress";
      setStressDetected(latestIsStressed || stressCount >= STRESS_COUNT_THRESHOLD);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Countdown for the active reset activity.
  useEffect(() => {
    if (!activeActivityId || isResetComplete) return;
    if (secondsLeft <= 0) {
      setIsResetComplete(true);
      return;
    }
    const timeout = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [activeActivityId, secondsLeft, isResetComplete]);

  // Cycles the calming instruction line under the timer for every activity
  // except breathing, which uses its own phase-synced loop below.
  useEffect(() => {
    const activity = RESET_ACTIVITIES.find((a) => a.id === activeActivityId);
    if (!activity || activity.id === "breathing" || isResetComplete || activity.instructions.length < 2) {
      return;
    }
    const interval = window.setInterval(() => {
      setInstructionIndex((i) => (i + 1) % activity.instructions.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [activeActivityId, isResetComplete]);

  // Breathing's in/hold/out loop — each phase holds for its own duration
  // (4s/2s/4s), driving both the "breathe in…" text and the circle's scale
  // from the same state so they never drift apart.
  useEffect(() => {
    if (activeActivityId !== "breathing" || isResetComplete) return;
    let cancelled = false;
    let timeoutId: number;
    const runPhase = (index: number) => {
      if (cancelled) return;
      setBreathPhaseIndex(index);
      timeoutId = window.setTimeout(
        () => runPhase((index + 1) % BREATH_PHASES.length),
        BREATH_PHASES[index].durationMs,
      );
    };
    runPhase(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeActivityId, isResetComplete]);

  const startReset = (activityId: string) => {
    const activity = RESET_ACTIVITIES.find((a) => a.id === activityId);
    if (!activity) return;
    setActiveActivityId(activityId);
    setSecondsLeft(activity.durationSec);
    setIsResetComplete(false);
    setInstructionIndex(0);
    setBreathPhaseIndex(0);
  };

  const exitReset = () => {
    setActiveActivityId(null);
    setIsResetComplete(false);
  };

  const handleQuickReset = () => {
    startReset("breathing");
    resetSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFindSupport = async () => {
    setIsFetchingSupport(true);
    setHasSearchedSupport(true);
    setSupportError(null);
    const result = await runTherapyNudge(user?.id ?? null);
    setIsFetchingSupport(false);
    if (result) {
      setSuggestionIds(result.map((s) => s.id));
    } else {
      setSupportError("Couldn't find anything nearby right now — try again later.");
    }
  };

  const handleTalkToSomeone = () => {
    professionalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!hasSearchedSupport) handleFindSupport();
  };

  const suggestions = suggestionIds
    .map((id) => therapySuggestions.find((s) => s.id === id))
    .filter((s): s is (typeof therapySuggestions)[number] => s !== undefined);

  // AI buddy message: an overwhelmed signal (self-reported or from recent
  // check-ins) takes priority over the workload-based read.
  const buddyMessage = useMemo(() => {
    if (selectedMood === "overwhelmed" || (!selectedMood && stressDetected)) {
      return "You don't have to handle everything at once. Let's focus on one small thing first.";
    }
    if (studyWorkSummary.loadPercent >= 70) {
      return `Your Study/Work workload is high — currently ${studyWorkSummary.loadPercent}%. Let's break your next task into a smaller step.`;
    }
    if (studyWorkSummary.loadPercent >= 40) {
      return "Your workload is starting to build up. Consider taking a short break after your next task.";
    }
    return "Your workload looks manageable today. Keep your current pace.";
  }, [selectedMood, stressDetected, studyWorkSummary.loadPercent]);

  const activeActivity = RESET_ACTIVITIES.find((a) => a.id === activeActivityId);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader title="Support" description="Take a moment to check in with yourself." />

      {/* 1. Daily check-in */}
      <section className="mb-6 rounded-2xl border border-line bg-paper-card p-5 sm:p-6">
        <p className="font-display text-base font-semibold text-ink">How are you feeling today?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOOD_OPTIONS.map(({ id, label, icon: Icon }) => {
            const selected = selectedMood === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedMood((m) => (m === id ? null : id))}
                aria-pressed={selected}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-display text-xs font-semibold transition-colors sm:text-sm ${
                  selected
                    ? "border-clay bg-clay text-white"
                    : "border-line bg-paper text-ink-soft hover:bg-line-soft"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Your check-in helps Paceful understand your current state and personalize your
          recommendations.
        </p>
      </section>

      {/* 2. AI Paceful Buddy */}
      <section className="mb-6 rounded-2xl border border-clay-light bg-clay-light/25 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <BuddyCharacter
            baseId={baseId}
            colorId={color}
            accessoryId={accessoryId}
            className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-clay-dark">
              <SparkleIcon className="h-4 w-4" />
              <span className="font-display text-xs font-bold uppercase tracking-wide">
                Your Paceful Buddy
              </span>
            </div>
            <div className="relative mt-2 rounded-2xl rounded-tl-sm border border-line bg-paper-card px-4 py-3">
              <p className="text-sm leading-snug text-ink">{buddyMessage}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleQuickReset}
            className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-xs font-semibold text-white transition-colors hover:bg-clay-dark sm:text-sm"
          >
            Start 3-min reset
          </button>
          <button
            type="button"
            onClick={() => onNavigate("room")}
            className="focus-ring rounded-full border border-line bg-paper px-4 py-2 font-display text-xs font-semibold text-ink-soft transition-colors hover:bg-line-soft sm:text-sm"
          >
            View my workload
          </button>
        </div>
      </section>

      {/* 3. 3-Minute Reset */}
      <section
        ref={resetSectionRef}
        className="mb-6 rounded-2xl border border-line bg-paper-card p-5 sm:p-6"
      >
        <p className="font-display text-base font-semibold text-ink">3-Minute Reset</p>
        <p className="mt-1 text-sm text-ink-soft">A quick activity to help you pause and reset.</p>

        {!activeActivity ? (
          <ul className="mt-4 divide-y divide-line-soft">
            {RESET_ACTIVITIES.map((activity) => (
              <li key={activity.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint/25 text-mint-shade"
                  aria-hidden="true"
                >
                  <activity.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold text-ink">{activity.title}</p>
                  <p className="text-xs text-ink-faint">{activity.durationLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startReset(activity.id)}
                  className="focus-ring shrink-0 rounded-full border border-line px-3.5 py-1.5 font-display text-xs font-semibold text-ink-soft transition-colors hover:border-clay hover:text-clay-dark"
                >
                  Start
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3 py-6 text-center">
            {isResetComplete ? (
              <>
                <p className="font-display text-lg font-semibold text-ink">
                  Nice. You gave yourself {activeActivity.durationLabel}.
                </p>
                <button
                  type="button"
                  onClick={exitReset}
                  className="focus-ring mt-2 rounded-full bg-clay px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-clay-dark"
                >
                  Back to Support
                </button>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-semibold text-ink">
                  {activeActivity.focusTitle}
                </p>
                <ResetVisual activity={activeActivity} breathPhase={BREATH_PHASES[breathPhaseIndex]} />
                <p className="font-display text-4xl font-bold tabular-nums text-clay">
                  {formatTime(secondsLeft)}
                </p>
                <p className="font-display text-lg font-semibold text-ink sm:text-xl">
                  {activeActivity.id === "breathing"
                    ? BREATH_PHASES[breathPhaseIndex].label
                    : activeActivity.instructions[instructionIndex % activeActivity.instructions.length]}
                </p>
                <button
                  type="button"
                  onClick={exitReset}
                  className="focus-ring mt-2 rounded-full border border-line px-4 py-2 font-display text-xs font-semibold text-ink-faint transition-colors hover:bg-line-soft"
                >
                  Back to Support
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* 4. What do you need right now? */}
      <section className="mb-6">
        <p className="mb-3 font-display text-base font-semibold text-ink">
          What do you need right now?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {NEED_CARDS.map(({ id, title, description, icon: Icon }) => {
            const selected = activeNeed === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveNeed((n) => (n === id ? null : id))}
                aria-pressed={selected}
                className={`focus-ring rounded-2xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-clay bg-clay-light/40"
                    : "border-line bg-paper-card hover:border-ink-faint"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    selected ? "bg-clay text-white" : "bg-line-soft text-ink-faint"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2.5 font-display text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-ink-soft">{description}</p>
              </button>
            );
          })}
        </div>

        {activeNeed && (
          <div className="mt-3 rounded-2xl border border-line bg-paper-card p-4 sm:p-5">
            {activeNeed === "calm" && (
              <>
                <p className="font-display text-sm font-semibold text-ink">Let's slow down together.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  A short breathing exercise can help settle your mind.
                </p>
                <button
                  type="button"
                  onClick={handleQuickReset}
                  className="focus-ring mt-3 rounded-full bg-clay px-4 py-2 font-display text-xs font-semibold text-white hover:bg-clay-dark"
                >
                  Start breathing
                </button>
              </>
            )}
            {activeNeed === "talk" && (
              <>
                <p className="font-display text-sm font-semibold text-ink">
                  You don't have to carry this alone.
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Connect with other students, or reach out to your university's support services.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate("community")}
                    className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-xs font-semibold text-white hover:bg-clay-dark"
                  >
                    Explore Community
                  </button>
                  <button
                    type="button"
                    onClick={handleTalkToSomeone}
                    className="focus-ring rounded-full border border-line px-4 py-2 font-display text-xs font-semibold text-ink-soft hover:bg-line-soft"
                  >
                    Find support
                  </button>
                </div>
              </>
            )}
            {activeNeed === "break" && (
              <>
                <p className="font-display text-sm font-semibold text-ink">Step away for a bit.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Here's what other students nearby are doing right now.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("community")}
                  className="focus-ring mt-3 rounded-full bg-clay px-4 py-2 font-display text-xs font-semibold text-white hover:bg-clay-dark"
                >
                  Explore Community
                </button>
              </>
            )}
            {activeNeed === "overwhelmed" && (
              <>
                <p className="font-display text-sm font-semibold text-ink">Let's shrink this down.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Your {CATEGORY_LABELS.study_work} workload is currently{" "}
                  <span className="font-semibold text-ink">{studyWorkSummary.loadPercent}%</span>.
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {urgentStudyTask
                    ? `Start with "${urgentStudyTask.title}" — just the next small step, not the whole thing.`
                    : "You don't have any Study/Work tasks logged yet — nothing urgent to tackle right now."}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("tasks")}
                  className="focus-ring mt-3 rounded-full bg-clay px-4 py-2 font-display text-xs font-semibold text-white hover:bg-clay-dark"
                >
                  View my tasks
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* 5. Community support */}
      <section className="mb-6 rounded-2xl border border-line bg-paper-card p-5 sm:p-6">
        <p className="font-display text-sm font-semibold text-ink">You're not the only one.</p>
        <p className="mt-1 text-sm text-ink-soft">
          See what other students are doing to take a break.
        </p>
        <ul className="mt-3 space-y-1.5">
          {COMMUNITY_HIGHLIGHTS.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-ink-soft">
              <UsersIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
              {line}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onNavigate("community")}
          className="focus-ring mt-4 rounded-full border border-line px-4 py-2 font-display text-xs font-semibold text-ink-soft transition-colors hover:bg-line-soft sm:text-sm"
        >
          Explore Community
        </button>
      </section>

      {/* 6. Professional support */}
      <section
        ref={professionalSectionRef}
        className="rounded-2xl border border-line bg-paper-card p-5 sm:p-6"
      >
        <p className="font-display text-sm font-semibold text-ink">Need someone to talk to?</p>
        <p className="mt-1 text-sm text-ink-soft">
          {stressDetected
            ? "Your recent check-ins suggest a stressful stretch — talking to someone nearby might help."
            : "If you feel like you need more support, you can connect with your university's counselling and student support services."}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleFindSupport}
            disabled={isFetchingSupport}
            className={`focus-ring rounded-full px-4 py-2 font-display text-xs font-semibold transition-colors sm:text-sm ${
              isFetchingSupport
                ? "cursor-not-allowed bg-line text-ink-faint"
                : "bg-clay text-white hover:bg-clay-dark"
            }`}
          >
            {isFetchingSupport ? "Finding support…" : "Find support"}
          </button>
          <button
            type="button"
            onClick={() => setShowResources((v) => !v)}
            aria-expanded={showResources}
            className="focus-ring rounded-full border border-line px-4 py-2 font-display text-xs font-semibold text-ink-soft transition-colors hover:bg-line-soft sm:text-sm"
          >
            View support resources
          </button>
        </div>

        {showResources && (
          <div className="mt-3 rounded-2xl border border-red-shade/30 bg-red-light/20 p-4 text-sm text-ink-soft">
            <p className="font-display text-xs font-bold uppercase tracking-wide text-red-shade">
              If you're in crisis
            </p>
            <p className="mt-1.5">
              This page only helps you find nearby professionals to talk to. If you're in
              immediate danger or crisis, please contact your local emergency number or a crisis
              helpline right away — you don't have to wait for a match here.
            </p>
          </div>
        )}

        {!isFetchingSupport && hasSearchedSupport && supportError && (
          <p className="mt-3 text-sm text-clay-dark">{supportError}</p>
        )}

        {!isFetchingSupport && suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {suggestions.map((suggestion) => (
              <TherapySuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onMarkContacted={() => markTherapySuggestionContacted(suggestion.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
