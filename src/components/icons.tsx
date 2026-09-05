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
