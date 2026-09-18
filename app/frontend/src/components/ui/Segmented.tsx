import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function Segmented<T extends string>({ label, value, options, onChange, disabled, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("inline-flex rounded-full border border-border bg-surface-sunken p-1", disabled && "opacity-60", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cx(
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 ease-out",
              selected ? "bg-surface-raised text-fg shadow-sm ring-1 ring-border" : "text-fg-muted hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
