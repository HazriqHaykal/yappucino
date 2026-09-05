import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { saveCheckIn } from "../services/checkIn";
import { useAuthStore } from "../store/useAuthStore";
import { useCharacterStore } from "../store/useCharacterStore";
import { MOOD_OPTIONS, type Mood } from "../types/checkIn";
import { CheckCircleIcon, MicIcon, StopIcon } from "./icons";

// The Web Speech API (SpeechRecognition) is a real browser feature but
// isn't part of TS's DOM lib — this is the minimal shape we actually use.
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface DailyCheckInModalProps {
  onClose: () => void;
  /** Fired once the check-in is saved, before the modal closes, so the
   * parent can react (e.g. show a buddy reply) to the mood/note. */
  onSaved?: (mood: Mood, note: string) => void;
}

export default function DailyCheckInModal({ onClose, onSaved }: DailyCheckInModalProps) {
  const user = useAuthStore((state) => state.user);
  const setMood = useCharacterStore((state) => state.setMood);

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speechSupported = getSpeechRecognitionCtor() !== null;

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) return;

    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNote(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleSave = async () => {
    if (!selectedMood) return;
    setMood(selectedMood);

    if (user) {
      setIsSaving(true);
      await saveCheckIn(user.id, selectedMood, note.trim());
      setIsSaving(false);
    }

    onSaved?.(selectedMood, note.trim());

    setSaved(true);
    window.setTimeout(onClose, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="w-full max-w-md rounded-3xl border border-line bg-paper-card p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            How are you feeling?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full p-1 text-ink-faint hover:bg-line-soft hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {saved ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 py-6 text-ink"
          >
            <CheckCircleIcon className="h-8 w-8 text-mint-shade" />
            <p className="font-display">Check-in saved</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <fieldset>
              <div className="flex flex-wrap justify-center gap-2">
                {MOOD_OPTIONS.map((option) => {
                  const selected = selectedMood === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedMood(option.id)}
                      aria-pressed={selected}
                      className={`focus-ring relative overflow-hidden rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                        selected
                          ? "border-clay text-white"
                          : "border-line bg-paper-card text-ink-soft hover:border-ink-faint"
                      }`}
                    >
                      {selected && (
                        <span className="absolute inset-0 z-0 rounded-full bg-clay" />
                      )}
                      <span className="relative z-10">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="checkin-note"
                  className="font-display text-sm font-medium text-ink"
                >
                  What's on your mind? (optional)
                </label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    aria-pressed={isRecording}
                    aria-label={isRecording ? "Stop recording" : "Record a voice note"}
                    className={`focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      isRecording
                        ? "border-clay bg-clay text-white"
                        : "border-line text-ink-soft hover:border-clay hover:text-clay-dark"
                    }`}
                  >
                    {isRecording ? (
                      <StopIcon className="h-3.5 w-3.5" />
                    ) : (
                      <MicIcon className="h-3.5 w-3.5" />
                    )}
                    {isRecording ? "Stop" : "Speak"}
                  </button>
                )}
              </div>
              <textarea
                id="checkin-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={
                  speechSupported
                    ? "Type, or tap Speak to talk it out…"
                    : "Type what's on your mind…"
                }
                className="focus-ring w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
              />
            </div>

            {!user && (
              <p className="text-xs text-ink-faint">
                Sign in with Google to save your check-ins — this one will
                still update your buddy's mood.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-full px-4 py-2 font-display text-sm font-medium text-ink-soft hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!selectedMood || isSaving}
                className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-sm font-medium text-white hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save check-in"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
