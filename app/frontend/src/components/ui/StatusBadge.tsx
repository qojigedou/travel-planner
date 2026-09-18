import type { TripStatus } from "../../lib/types";
import { cx } from "../../lib/cx";

const styles: Record<TripStatus, { chip: string; dot: string; label: string }> = {
  Planned: { chip: "bg-planned-soft text-planned-fg", dot: "bg-planned", label: "Planned" },
  Active: { chip: "bg-active-soft text-active-fg", dot: "bg-active", label: "On the road" },
  Done: { chip: "bg-done-soft text-done-fg", dot: "bg-done", label: "Completed" },
};

export const statusLabel = (status: TripStatus) => styles[status].label;
export const statusDot = (status: TripStatus) => styles[status].dot;

export function StatusBadge({ status, className, onImage }: { status: TripStatus; className?: string; onImage?: boolean }) {
  const style = styles[status];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[var(--badge-radius)] px-2.5 py-1 text-xs font-semibold",
        onImage ? "bg-[var(--chip-on-image-bg)] text-[var(--chip-on-image-fg)] shadow-xs backdrop-blur" : style.chip,
        className,
      )}
    >
      <span className={cx("size-1.5 rounded-full", style.dot, status === "Active" && "animate-pulse")} aria-hidden />
      {style.label}
    </span>
  );
}
