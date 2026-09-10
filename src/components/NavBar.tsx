import type { ComponentType } from "react";
import { ClipboardIcon, HeartHandIcon, HomeIcon, UsersIcon } from "./icons";

export type Tab = "room" | "tasks" | "community" | "therapy";

const TABS: { id: Tab; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: "room", label: "Room", Icon: HomeIcon },
  { id: "tasks", label: "Tasks", Icon: ClipboardIcon },
  { id: "community", label: "Community", Icon: UsersIcon },
  { id: "therapy", label: "Therapy", Icon: HeartHandIcon },
];

interface NavBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.9rem)" }}
    >
      <div className="flex items-center gap-1 rounded-full border border-clay/25 bg-paper-card/95 p-1.5 shadow-pop backdrop-blur-sm sm:gap-1.5 sm:p-2">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active === id ? "page" : undefined}
            className={`focus-ring flex flex-col items-center gap-0.5 rounded-full px-4 py-2 transition-colors sm:px-6 sm:py-2.5 ${
              active === id ? "bg-clay-light text-clay-dark" : "text-ink-soft hover:bg-line-soft"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-display text-[10px] font-semibold sm:text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
