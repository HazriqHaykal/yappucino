interface SpeechBubbleProps {
  isLoading: boolean;
  text: string | null;
}

export default function SpeechBubble({ isLoading, text }: SpeechBubbleProps) {
  return (
    <div className="relative inline-block max-w-sm">
      <div className="rounded-2xl border border-line bg-paper-card px-4 py-3 shadow-pop">
        {isLoading ? (
          <span className="flex items-center gap-1 py-1" aria-label="Buddy is thinking">
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-ink-faint" />
          </span>
        ) : (
          <p className="font-display text-sm text-ink">{text}</p>
        )}
      </div>
      {/* Triangle tail pointing down toward the buddy */}
      <div className="absolute left-8 top-full h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-paper-card" />
    </div>
  );
}
