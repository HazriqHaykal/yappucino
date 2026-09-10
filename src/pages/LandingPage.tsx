import { motion } from "framer-motion";
import BuddyCharacter from "../components/characters/BuddyCharacter";

interface LandingPageProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export default function LandingPage({ onGetStarted, onSkip }: LandingPageProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-paper px-5 py-6 sm:px-8 sm:py-8">
      {/* soft decorative blobs — purely atmospheric, kept out of the way of content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-mint/30 blur-3xl sm:h-80 sm:w-80"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/3 h-56 w-56 rounded-full bg-sky/30 blur-3xl sm:h-72 sm:w-72"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-yellow/25 blur-3xl sm:h-80 sm:w-80"
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-display text-5xl font-bold tracking-tight text-clay sm:text-7xl"
        >
          Paceful
        </motion.p>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-lavender/40 blur-3xl"
          />
          <BuddyCharacter className="h-32 w-32 sm:h-40 sm:w-40" />
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
            A calmer way to carry your week
          </h1>
          <p className="mt-3 text-sm text-ink-soft sm:text-base">
            Turn your to-dos into a room you actually want to tend. Gentle
            nudges instead of guilt, one small step at a time.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <motion.button
            type="button"
            onClick={onGetStarted}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="focus-ring rounded-full bg-clay px-8 py-3.5 font-display text-sm font-semibold text-white shadow-pop transition-colors hover:bg-clay-dark sm:text-base"
          >
            Get started
          </motion.button>
          <button
            type="button"
            onClick={onSkip}
            className="focus-ring rounded-full px-4 py-2 font-display text-sm font-semibold text-ink-faint underline decoration-line underline-offset-4 transition-colors hover:text-ink-soft"
          >
            Peek at your room
          </button>
        </div>
      </div>

      <p className="relative mt-6 text-center text-xs text-ink-faint">
       "Beating Burnout, One Day at a Time"
      </p>
    </div>
  );
}
