interface ActiveSwitchProps {
  value: boolean;
  onToggle: (next: boolean) => void;
}

export function ActiveSwitch({ value, onToggle }: ActiveSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onToggle(!value)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        value ? 'bg-red' : 'bg-border-strong'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
