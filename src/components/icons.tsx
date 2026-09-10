interface IconProps {
  className?: string;
}

// Minimal line icons matching the app's existing stroke style (see the
// checkmark in ColorSelector.tsx) — kept deliberately plain rather than
// pulling in an icon library or using emoji.

export function PaletteIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 3.5c-4.7 0-8.5 3.6-8.5 8 0 3 2.1 4.3 3.8 4.3.8 0 1.2-.4 1.2-1 0-.5-.4-.8-.4-1.6 0-1.2 1-2.2 2.5-2.2h2.1c2.4 0 4.3-1.7 4.3-4C17 4.9 14.7 3.5 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="9.2" r="1" fill="currentColor" />
      <circle cx="11.5" cy="7" r="1" fill="currentColor" />
      <circle cx="14.8" cy="9.2" r="1" fill="currentColor" />
    </svg>
  );
}

export function CameraIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 8.5c0-.8.7-1.5 1.5-1.5h1.8l1-1.6c.3-.4.7-.6 1.2-.6h4.9c.5 0 .9.2 1.2.6l1 1.6h1.9c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ChatIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4.5 12c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5-3.4 6.5-7.5 6.5c-.9 0-1.7-.1-2.5-.4l-3.3 1.4.7-2.9C5.3 15.4 4.5 13.8 4.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MicIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="9.25"
        y="3.5"
        width="5.5"
        height="9.5"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6 11c0 3.3 2.7 5.5 6 5.5s6-2.2 6-5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 16.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function StopIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

export function BellIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 10.5c0-3.3 2.7-6 6-6s6 2.7 6 6c0 3.4 1 5 1.7 5.8.3.4 0 1-.5 1H4.8c-.5 0-.8-.6-.5-1C5 15.5 6 13.9 6 10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 19.5c.4.7 1.1 1 2 1s1.6-.3 2-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BellOffIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 10.5c0-3.3 2.7-6 6-6 1.5 0 2.9.6 4 1.5M18 10.5c0 3.4 1 5 1.7 5.8.3.4 0 1-.5 1H8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 12c-.4 1.5-1.1 2.7-1.7 3.5-.3.4 0 1-.5 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 19.5c.4.7 1.1 1 2 1s1.6-.3 2-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3.5M16 3.5v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.5 12.3l2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v8.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 19.5V14.5h4v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function ClipboardIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="5.5" y="5" width="13" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect
        x="9"
        y="3.5"
        width="6"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function LeafIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 19c-1.5-5.5 1-11 11.5-13 1 6-1 11-6 13.5-2 1-4 .5-5.5-.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 18c2-3 4.5-6 8-8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function HeartHandIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 19c-4-2.6-7.5-5.6-7.5-9.2C4.5 7 6.4 5.3 8.6 5.3c1.4 0 2.7.7 3.4 1.8.7-1.1 2-1.8 3.4-1.8 2.2 0 4.1 1.7 4.1 4.5 0 3.6-3.5 6.6-7.5 9.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.5 19c.9-3.4 3.3-5.3 6.5-5.3s5.6 1.9 6.5 5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartIcon({ className = "", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M12 19.3c-4.1-2.6-7.5-5.7-7.5-9.3 0-2.5 1.9-4.3 4.3-4.3 1.4 0 2.6.7 3.2 1.7.6-1 1.8-1.7 3.2-1.7 2.4 0 4.3 1.8 4.3 4.3 0 3.6-3.4 6.7-7.5 9.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GearIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.55 1.55M7.85 16.15 6.3 17.7M17.7 17.7l-1.55-1.55M7.85 7.85 6.3 6.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HelpCircleIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.6 9.3c.2-1.3 1.2-2.1 2.5-2.1 1.4 0 2.5.9 2.5 2.1 0 1.6-2.4 1.7-2.4 3.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.6" r="1" fill="currentColor" />
    </svg>
  );
}

export function UsersIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="8.3" r="2.8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.8 18.3c.5-2.8 2.6-4.4 5.2-4.4s4.7 1.6 5.2 4.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15.2 6.1c1.3.3 2.3 1.4 2.3 2.9 0 1.4-.9 2.5-2.1 2.9M17.3 13.9c1.9.5 3.2 1.9 3.6 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BasketIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4.5 10.5h15l-1.6 8.2a1.6 1.6 0 0 1-1.57 1.3H7.67a1.6 1.6 0 0 1-1.57-1.3L4.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 10.5 9 5.5m6.8 5-.8-5M3.2 10.5h17.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.3 13.5v4.2M13.7 13.5v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SparkleIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 4.5c.4 2.8 1.3 4.4 4.2 5.2-2.9.8-3.8 2.4-4.2 5.2-.4-2.8-1.3-4.4-4.2-5.2 2.9-.8 3.8-2.4 4.2-5.2Z"
        fill="currentColor"
      />
      <path
        d="M18.3 14.5c.2 1.4.7 2.2 2.1 2.6-1.4.4-1.9 1.2-2.1 2.6-.2-1.4-.7-2.2-2.1-2.6 1.4-.4 1.9-1.2 2.1-2.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MapPinIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.9 6.5 11 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function LinkIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M9.5 14.5 14.5 9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M11 7.8 12.2 6.6a3.4 3.4 0 0 1 4.8 4.8L15.8 12.6M13 16.2l-1.2 1.2a3.4 3.4 0 0 1-4.8-4.8l1.2-1.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CoffeeIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 9.5h11v5.2a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 11h1.4a2.1 2.1 0 0 1 0 4.2H16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 6.3c0-.8.9-1 .9-1.8M11.5 6.3c0-.8.9-1 .9-1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function WalkIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="13.3" cy="4.8" r="1.6" fill="currentColor" />
      <path
        d="M11 8.2 8.6 11l1 3.4-3 5.4M11 8.2l3.4.6 2.6 2.7M13.5 13l3.3 1.5-1 4.9M8.6 11l3.6 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
