export type Tab = "room" | "tasks" | "recovery";

const TABS: { id: Tab; label: string }[] = [
  { id: "room", label: "Room" },
  { id: "tasks", label: "Tasks" },
  { id: "recovery", label: "Suggest Recovery" },
];

interface NavBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-1 px-5 sm:h-16 sm:px-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id ? "page" : undefined}
            className={`focus-ring rounded-full px-3 py-2 font-display text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
              active === tab.id
                ? "bg-clay text-white"
                : "text-ink-soft hover:bg-line-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
