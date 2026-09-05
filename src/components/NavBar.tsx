import type { ComponentType } from "react";
import { ClipboardIcon, HeartHandIcon, HomeIcon, LeafIcon } from "./icons";

export type Tab = "room" | "tasks" | "recovery" | "therapy";

const TABS: { id: Tab; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: "room", label: "Room", Icon: HomeIcon },
  { id: "tasks", label: "Tasks", Icon: ClipboardIcon },
  { id: "recovery", label: "Recovery", Icon: LeafIcon },
  { id: "therapy", label: "Therapy", Icon: HeartHandIcon },
];

interface NavBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-1 px-3 pb-[env(safe-area-inset-bottom)] sm:h-20 sm:justify-center sm:gap-2 sm:px-8">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active === id ? "page" : undefined}
            className={`focus-ring flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors sm:flex-none sm:px-5 sm:py-2 ${
              active === id ? "bg-clay/10 text-clay" : "text-ink-soft hover:bg-line-soft"
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
