import { ArrowLeft, CalendarDays, MapPinned, Pencil, Plus, Signpost, Trash } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useDeleteStop, useUpdateStop } from "../api/geopoints";
import { useDeleteTrip, useTrip, useUpdateTrip } from "../api/trips";
import { StopFormDialog } from "../components/stops/StopFormDialog";
import { StopItem } from "../components/stops/StopItem";
import { TripFormDialog } from "../components/trips/TripFormDialog";
import { Button, ButtonLink } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Segmented } from "../components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { StatusBadge, statusLabel } from "../components/ui/StatusBadge";
import { ApiError, errorMessage } from "../lib/api";
import { coverFor } from "../lib/cover";
import { formatLongDate, plural, relativeDay } from "../lib/format";
import { TRIP_STATUSES, type GeoPoint, type TripStatus } from "../lib/types";

const StopsMap = lazy(() => import("../components/stops/StopsMap"));

export function TripDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data: trip, isPending, error, refetch } = useTrip(id);

  const updateTrip = useUpdateTrip(id);
  const deleteTrip = useDeleteTrip();
  const updateStop = useUpdateStop();
  const deleteStop = useDeleteStop();

  const [editingTrip, setEditingTrip] = useState(false);
  const [confirmTripDelete, setConfirmTripDelete] = useState(false);
  const [addingStop, setAddingStop] = useState(false);
  const [editingStop, setEditingStop] = useState<GeoPoint | null>(null);
  const [deletingStop, setDeletingStop] = useState<GeoPoint | null>(null);
  const [hoveredStop, setHoveredStop] = useState<number | null>(null);

  const stops = useMemo(() => [...(trip?.geopoints ?? [])].sort((a, b) => a.id - b.id), [trip]);
  const numbered = stops.map((stop, i) => ({ stop, number: i + 1 }));
  const mapped = numbered.filter(({ stop }) => stop.geo_latitude != null && stop.geo_longitude != null);
  const visited = stops.filter((s) => s.status === "Visited").length;

  if (isPending) return <DetailSkeleton />;

  if (error || !trip) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {notFound ? (
          <EmptyState
            icon={<Signpost className="size-7" />}
            title="This trip took a detour"
            action={<ButtonLink to="/">Back to trips</ButtonLink>}
          >
            We couldn't find it. It may have been deleted.
          </EmptyState>
        ) : (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        )}
      </div>
    );
  }

  const cover = coverFor(`${trip.id}:${trip.title}`);

  const changeStatus = (status: TripStatus) => {
    if (status === trip.status) return;
    updateTrip.mutate(
      { status },
      {
        onSuccess: () => toast.success(`Marked as ${statusLabel(status).toLowerCase()}`),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  };

  const toggleVisited = (stop: GeoPoint) => {
    const status = stop.status === "Visited" ? "Not Visited" : "Visited";
    updateStop.mutate({ id: stop.id, patch: { status } }, { onError: (e) => toast.error(errorMessage(e)) });
  };

  const removeTrip = () =>
    deleteTrip.mutate(trip.id, {
      onSuccess: () => {
        toast.success(`Deleted “${trip.title}”`);
        navigate("/", { replace: true });
      },
      onError: (e) => toast.error(errorMessage(e)),
    });

  const removeStop = () => {
    if (!deletingStop) return;
    deleteStop.mutate(deletingStop.id, {
      onSuccess: () => {
        toast.success(`Removed ${deletingStop.name}`);
        setDeletingStop(null);
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      {/* Cover */}
      <section
        className="animate-rise relative isolate overflow-hidden rounded-[var(--round-2xl)] text-white shadow-md"
        style={{ background: cover.background }}
      >
        <div className="topo absolute inset-0 -z-10 opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        <div className="flex min-h-[280px] flex-col p-5 sm:min-h-[320px] sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/20 py-1.5 pl-2.5 pr-3.5 text-[13px] font-semibold backdrop-blur-md transition-colors hover:bg-black/35"
            >
              <ArrowLeft className="size-4" /> All trips
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingTrip(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--chip-on-image-bg)] px-3.5 text-[13px] font-semibold text-[var(--chip-on-image-fg)] shadow-xs backdrop-blur-md transition-colors hover:bg-[var(--chip-on-image-bg-hover)]"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmTripDelete(true)}
                aria-label="Delete trip"
                className="grid size-9 place-items-center rounded-full bg-black/20 backdrop-blur-md transition-colors hover:bg-danger hover:text-[var(--danger-fg)]"
              >
                <Trash className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <StatusBadge status={trip.status} onImage />
            <h1 className="mt-3 max-w-3xl text-4xl font-medium leading-[1.05] drop-shadow-sm sm:text-6xl">{trip.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[15px] text-white/90">
              <CalendarDays className="size-4" aria-hidden />
              <span>{formatLongDate(trip.date)}</span>
              <span aria-hidden>·</span>
              <span className="first-letter:uppercase">{relativeDay(trip.date)}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="mt-5 flex flex-col gap-4 rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-[13px] font-semibold text-fg-muted">Trip status</span>
          <Segmented<TripStatus>
            label="Trip status"
            value={trip.status}
            onChange={changeStatus}
            options={TRIP_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
          />
        </div>
        <div className="min-w-56 sm:text-right">
          <p className="text-[13px] text-fg-muted">
            <span className="tabular text-lg font-semibold text-fg">{visited}</span> of {plural(stops.length, "stop")} visited
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full rounded-full bg-done transition-[width] duration-700 ease-out"
              style={{ width: `${stops.length ? (visited / stops.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </section>

      {/* Itinerary + map */}
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="itinerary">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="itinerary" className="text-3xl font-medium">
              Itinerary
            </h2>
            <Button icon={<Plus className="size-4" />} onClick={() => setAddingStop(true)}>
              Add stop
            </Button>
          </div>

          {stops.length === 0 ? (
            <EmptyState
              icon={<MapPinned className="size-7" />}
              title="No stops yet"
              action={
                <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setAddingStop(true)}>
                  Add the first stop
                </Button>
              }
            >
              Add museums, viewpoints, restaurants, the hotel — anything worth a pin.
            </EmptyState>
          ) : (
            <ol className="flex flex-col gap-3">
              {numbered.map(({ stop, number }) => (
                <StopItem
                  key={stop.id}
                  stop={stop}
                  number={number}
                  highlighted={hoveredStop === stop.id}
                  onHover={(hovered) => setHoveredStop(hovered ? stop.id : null)}
                  onToggleVisited={() => toggleVisited(stop)}
                  onEdit={() => setEditingStop(stop)}
                  onDelete={() => setDeletingStop(stop)}
                />
              ))}
            </ol>
          )}
        </section>

        <aside className="lg:col-span-5" aria-label="Map">
          <div className="sticky top-24 h-[360px] overflow-hidden rounded-[var(--card-radius)] border border-[var(--card-border)] bg-surface-sunken shadow-sm lg:h-[560px]">
            {mapped.length ? (
              <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
                <StopsMap stops={mapped} highlightedId={hoveredStop} />
              </Suspense>
            ) : (
              <div className="flex size-full flex-col items-center justify-center p-8 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-surface-raised text-fg-muted shadow-sm">
                  <MapPinned className="size-7" />
                </div>
                <p className="mt-4 font-semibold">Nothing on the map yet</p>
                <p className="mt-1 max-w-64 text-sm text-fg-muted">
                  Stops with coordinates show up here. Paste a map link when adding one.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <TripFormDialog open={editingTrip} onClose={() => setEditingTrip(false)} trip={trip} />
      <StopFormDialog open={addingStop} onClose={() => setAddingStop(false)} tripId={trip.id} />
      <StopFormDialog open={editingStop != null} onClose={() => setEditingStop(null)} stop={editingStop ?? undefined} />

      <ConfirmDialog
        open={confirmTripDelete}
        title="Delete this trip?"
        description={`“${trip.title}” will be gone for good. Places you added stay in your Places list.`}
        confirmLabel="Delete trip"
        loading={deleteTrip.isPending}
        onConfirm={removeTrip}
        onClose={() => setConfirmTripDelete(false)}
      />
      <ConfirmDialog
        open={deletingStop != null}
        title="Remove this stop?"
        description={`${deletingStop?.name ?? "This place"} will be deleted everywhere it's used, not just from this trip.`}
        confirmLabel="Remove stop"
        loading={deleteStop.isPending}
        onConfirm={removeStop}
        onClose={() => setDeletingStop(null)}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6" aria-busy>
      <Skeleton className="h-[280px] rounded-[var(--round-2xl)] sm:h-[320px]" />
      <Skeleton className="mt-5 h-20 rounded-[var(--card-radius)]" />
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <Skeleton className="mb-5 h-9 w-40" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[360px] rounded-[var(--card-radius)] lg:col-span-5 lg:h-[560px]" />
      </div>
    </div>
  );
}
