interface StickyNoteProps {
  text: string;
  done: boolean;
  onToggle: () => void;
  rotationDeg: number;
  color: "yellow" | "lavender";
}

export default function StickyNote({
  text,
  done,
  onToggle,
  rotationDeg,
  color,
}: StickyNoteProps) {
  const bgClass = color === "yellow" ? "bg-yellow" : "bg-lavender";

  return (
    <div
      className={`w-36 rounded-lg ${bgClass} p-3 shadow-pop`}
      style={{ transform: `rotate(${rotationDeg}deg)` }}
    >
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggle}
          className="mt-0.5 accent-ink"
        />
        <span
          className={`font-display text-sm text-ink ${done ? "opacity-50 line-through" : ""}`}
        >
          {text}
        </span>
      </label>
    </div>
  );
}
