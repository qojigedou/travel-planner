import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router";
import { coverFor } from "../../lib/cover";
import { formatDate, plural, relativeDay } from "../../lib/format";
import type { Trip, TripListItem } from "../../lib/types";
import { Skeleton } from "../ui/States";
import { StatusBadge } from "../ui/StatusBadge";

interface TripCardProps {
  item: TripListItem;
  detail?: Trip;
  index: number;
}

export function TripCard({ item, detail, index }: TripCardProps) {
  const cover = coverFor(`${item.id}:${item.title}`);
  const stops = detail?.geopoints ?? [];
  const visited = stops.filter((s) => s.status === "Visited").length;
  const progress = stops.length ? visited / stops.length : 0;

  return (
    <Link
      to={`/trips/${item.id}`}
      className="animate-rise group flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--card-shadow-hover)]"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="relative h-36 overflow-hidden" style={{ background: cover.background }}>
        <div className="topo absolute inset-0 opacity-40 transition-transform duration-700 ease-out group-hover:scale-110" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
        <StatusBadge status={item.status} onImage className="absolute left-4 top-4" />
        {detail && (
          <span className="absolute bottom-3 right-4 inline-flex items-center gap-1 text-xs font-semibold text-white drop-shadow">
            <MapPin className="size-3.5" aria-hidden />
            {plural(stops.length, "stop")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex h-5 items-center gap-1.5 text-[13px] text-fg-muted">
          {detail ? (
            <>
              <CalendarDays className="size-3.5" aria-hidden />
              <span className="tabular">{formatDate(detail.date)}</span>
              <span className="text-fg-subtle" aria-hidden>
                ·
              </span>
              <span className="text-fg-subtle first-letter:uppercase">{relativeDay(detail.date)}</span>
            </>
          ) : (
            <Skeleton className="h-3.5 w-40" />
          )}
        </div>

        <h3 className="line-clamp-2 text-[22px] font-semibold leading-tight transition-colors group-hover:text-primary">
          {item.title}
        </h3>

        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>{stops.length ? `${visited} of ${stops.length} visited` : detail ? "No stops yet" : " "}</span>
            {stops.length > 0 && <span className="tabular font-semibold text-fg">{Math.round(progress * 100)}%</span>}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full rounded-full bg-done transition-[width] duration-700 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)]">
      <Skeleton className="h-36 rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-6 h-1.5 w-full" />
      </div>
    </div>
  );
}
