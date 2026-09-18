import { Check, ExternalLink, MapPin, MapPinned, Pencil, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { useDeleteStop, useGeoPointDetails, useGeoPoints, useUpdateStop } from "../api/geopoints";
import { StopFormDialog } from "../components/stops/StopFormDialog";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Pagination } from "../components/ui/Pagination";
import { StarDisplay } from "../components/ui/StarRating";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { errorMessage } from "../lib/api";
import { cx } from "../lib/cx";
import { formatCoords, formatDate, hostname, plural } from "../lib/format";
import type { GeoPoint, GeoPointListItem } from "../lib/types";

const PER_PAGE = 12;

export function PlacesPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);

  const list = useGeoPoints(page, PER_PAGE);
  const items = list.data?.geopoints ?? [];
  const details = useGeoPointDetails(items.map((g) => g.id));

  const updateStop = useUpdateStop();
  const deleteStop = useDeleteStop();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GeoPoint | null>(null);
  const [deleting, setDeleting] = useState<GeoPoint | null>(null);

  const setPage = (next: number) => {
    setParams(next > 1 ? { page: String(next) } : {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const total = list.data?.total_items ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <section className="flex flex-col gap-6 pb-10 pt-10 sm:pt-16 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Pinned places</p>
          <h1 className="text-[44px] font-medium leading-[1.02] sm:text-6xl">Places</h1>
          <p className="mt-4 text-[17px] text-fg-muted">
            {list.isPending
              ? "Gathering your pins…"
              : total
                ? `${plural(total, "place")} across all of your trips.`
                : "Every stop you add to a trip lands here too."}
          </p>
        </div>
        <Button size="lg" variant="secondary" icon={<Plus className="size-5" />} onClick={() => setAdding(true)} className="self-start md:self-auto">
          Add place
        </Button>
      </section>

      {list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-[var(--card-radius)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MapPinned className="size-7" />}
          title={page > 1 ? "Nothing on this page" : "No places yet"}
          action={
            <Button icon={<Plus className="size-4" />} onClick={() => (page > 1 ? setPage(1) : setAdding(true))}>
              {page > 1 ? "Back to the first page" : "Add a place"}
            </Button>
          }
        >
          {page > 1 ? "This page is empty." : "Pin somewhere you'd love to go. You can attach places to trips from a trip's page."}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-10">
          <ul className={cx("grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3", list.isPlaceholderData && "opacity-60")}>
            {items.map((item, i) => (
              <PlaceCard
                key={item.id}
                item={item}
                detail={details[i]?.data}
                index={i}
                onToggle={(place) =>
                  updateStop.mutate(
                    { id: place.id, patch: { status: place.status === "Visited" ? "Not Visited" : "Visited" } },
                    { onError: (e) => toast.error(errorMessage(e)) },
                  )
                }
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </ul>
          <Pagination page={page} totalPages={list.data?.total_pages ?? 1} onChange={setPage} />
        </div>
      )}

      <StopFormDialog open={adding} onClose={() => setAdding(false)} />
      <StopFormDialog open={editing != null} onClose={() => setEditing(null)} stop={editing ?? undefined} />
      <ConfirmDialog
        open={deleting != null}
        title="Delete this place?"
        description={`${deleting?.name ?? "It"} will also disappear from every trip it's part of.`}
        confirmLabel="Delete place"
        loading={deleteStop.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          deleteStop.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(`Deleted ${deleting.name}`);
              setDeleting(null);
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </div>
  );
}

interface PlaceCardProps {
  item: GeoPointListItem;
  detail?: GeoPoint;
  index: number;
  onToggle: (place: GeoPoint) => void;
  onEdit: (place: GeoPoint) => void;
  onDelete: (place: GeoPoint) => void;
}

function PlaceCard({ item, detail, index, onToggle, onEdit, onDelete }: PlaceCardProps) {
  const visited = detail?.status === "Visited";
  const hasCoords = detail?.geo_latitude != null && detail?.geo_longitude != null;

  return (
    <li
      className="animate-rise group flex flex-col rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] transition-shadow duration-300 hover:shadow-[var(--card-shadow-hover)]"
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cx(
            "grid size-10 shrink-0 place-items-center rounded-xl transition-colors duration-200",
            visited ? "bg-done-soft text-done-fg" : "bg-primary-soft text-primary-soft-fg",
          )}
          aria-hidden
        >
          <MapPin className="size-5" />
        </span>
        {detail && (
          <div className="flex gap-0.5 transition-opacity duration-150 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(detail)} aria-label={`Edit ${item.name}`}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(detail)}
              aria-label={`Delete ${item.name}`}
              className="hover:bg-danger-soft hover:text-danger"
            >
              <Trash className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <h3 className="mt-4 break-words text-xl font-semibold leading-snug">{item.name}</h3>

      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-muted">
        {detail ? (
          <>
            <StarDisplay score={detail.score} />
            {hasCoords && <span className="tabular">{formatCoords(detail.geo_latitude!, detail.geo_longitude!)}</span>}
            {detail.geo_link && (
              <a
                href={detail.geo_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                {hostname(detail.geo_link)}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </>
        ) : (
          <Skeleton className="h-3.5 w-36" />
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-xs text-fg-subtle">Added {formatDate(item.addition_date)}</span>
        {detail && (
          <button
            type="button"
            onClick={() => onToggle(detail)}
            aria-pressed={visited}
            className={cx(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all duration-200 active:scale-95",
              visited
                ? "border-transparent bg-done text-done-contrast"
                : "border-border-strong text-fg-muted hover:border-done hover:text-done-fg",
            )}
          >
            <Check className="size-3.5" />
            {visited ? "Visited" : "Mark visited"}
          </button>
        )}
      </div>
    </li>
  );
}
