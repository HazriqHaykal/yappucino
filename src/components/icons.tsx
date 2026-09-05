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
