import { NAME_MAX_LENGTH } from "../data/characterOptions";

interface CharacterNameInputProps {
  name: string;
  onChange: (name: string) => void;
}

export default function CharacterNameInput({
  name,
  onChange,
}: CharacterNameInputProps) {
  return (
    <div>
      <label
        htmlFor="buddy-name"
        className="font-display text-sm font-semibold tracking-wide text-ink"
      >
        Give your buddy a name
      </label>
      <div className="relative mt-3">
        <input
          id="buddy-name"
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Mochi, Coco, Pip..."
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          className="focus-ring w-full rounded-2xl border border-line bg-paper-card px-4 py-3 font-body text-base text-ink placeholder:text-ink-faint"
        />
        <span
          className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-ink-faint"
          aria-hidden="true"
        >
          {name.length}/{NAME_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
