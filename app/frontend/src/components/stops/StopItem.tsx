import { Check, ExternalLink, MapPin, Pencil, Trash } from "lucide-react";
import { cx } from "../../lib/cx";
import { formatCoords, formatDate, hostname } from "../../lib/format";
import type { GeoPoint } from "../../lib/types";
import { Button } from "../ui/Button";
import { StarDisplay } from "../ui/StarRating";

interface StopItemProps {
  stop: GeoPoint;
  /** 1-based position, matches the numbered map marker. */
  number?: number;
  highlighted?: boolean;
  onToggleVisited: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHover?: (hovered: boolean) => void;
}

export function StopItem({ stop, number, highlighted, onToggleVisited, onEdit, onDelete, onHover }: StopItemProps) {
  const visited = stop.status === "Visited";
  const hasCoords = stop.geo_latitude != null && stop.geo_longitude != null;

  return (
    <li
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={cx(
        "group relative flex gap-4 rounded-2xl border bg-[var(--card-bg)] p-4 transition-[border-color,box-shadow] duration-200 sm:p-5",
        highlighted ? "border-border-strong shadow-md" : "border-[var(--card-border)] shadow-xs",
      )}
    >
      {number != null && (
        <span
          className={cx(
            "tabular grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors duration-200",
            visited ? "bg-done-soft text-done-fg" : "bg-primary-soft text-primary-soft-fg",
          )}
          aria-hidden
        >
          {number}
        </span>
      )}

      {/* Phones: name → details → actions. Wider: actions sit beside the name. */}
      <div className="grid min-w-0 flex-1 gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <h3 className="min-w-0 pt-1 font-sans text-base font-semibold leading-snug tracking-normal sm:col-start-1 sm:row-start-1">
          <span className={cx("break-words", visited && "text-fg-muted")}>{stop.name}</span>
        </h3>

        <div className="order-last -mb-1 flex flex-row-reverse items-center justify-between gap-0.5 sm:order-none sm:col-start-2 sm:row-start-1 sm:mb-0 sm:flex-row sm:justify-end">
          <div className="flex items-center gap-0.5 transition-opacity duration-150 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${stop.name}`}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              aria-label={`Delete ${stop.name}`}
              className="hover:bg-danger-soft hover:text-danger"
            >
              <Trash className="size-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={onToggleVisited}
            aria-pressed={visited}
            className={cx(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all duration-200 active:scale-95 sm:ml-1",
              visited
                ? "border-transparent bg-done text-done-contrast"
                : "border-border-strong text-fg-muted hover:border-done hover:text-done-fg",
            )}
          >
            <Check className={cx("size-3.5 transition-transform duration-200", visited ? "scale-100" : "scale-90 opacity-60")} />
            {visited ? "Visited" : "Mark visited"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-fg-muted sm:col-span-2">
          <StarDisplay score={stop.score} />
          {hasCoords && (
            <span className="tabular inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {formatCoords(stop.geo_latitude!, stop.geo_longitude!)}
            </span>
          )}
          {stop.geo_link && (
            <a
              href={stop.geo_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              {hostname(stop.geo_link)}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
          <span className="text-fg-subtle">Added {formatDate(stop.addition_date)}</span>
        </div>
      </div>
    </li>
  );
}
