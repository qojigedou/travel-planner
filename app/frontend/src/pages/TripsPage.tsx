import { Luggage, Plus } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useTripDetails, useTrips } from "../api/trips";
import { TripCard, TripCardSkeleton } from "../components/trips/TripCard";
import { TripFormDialog } from "../components/trips/TripFormDialog";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ErrorState } from "../components/ui/States";
import { errorMessage } from "../lib/api";
import { plural } from "../lib/format";

const PER_PAGE = 9;

export function TripsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [creating, setCreating] = useState(false);

  const trips = useTrips(page, PER_PAGE);
  const items = trips.data?.trips ?? [];
  const details = useTripDetails(items.map((t) => t.id));

  const setPage = (next: number) => {
    setParams(next > 1 ? { page: String(next) } : {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const total = trips.data?.total_items ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <section className="relative flex flex-col gap-6 pb-10 pt-10 sm:pt-16 md:flex-row md:items-end md:justify-between">
        <RouteDoodle />
        <div className="relative max-w-xl">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Your travel log</p>
          <h1 className="text-[44px] font-medium leading-[1.02] sm:text-6xl">
            Where to <em className="font-display italic text-primary">next?</em>
          </h1>
          <p className="mt-4 text-[17px] text-fg-muted">
            {trips.isPending
              ? "Unpacking your plans…"
              : total
                ? `${plural(total, "trip")} on the map. Pick one up or start something new.`
                : "Sketch out a trip, drop in the places you can't miss, and tick them off as you go."}
          </p>
        </div>
        <Button size="lg" icon={<Plus className="size-5" />} onClick={() => setCreating(true)} className="relative self-start md:self-auto">
          New trip
        </Button>
      </section>

      {trips.isError ? (
        <ErrorState message={errorMessage(trips.error)} onRetry={() => trips.refetch()} />
      ) : trips.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <TripCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Luggage className="size-7" />}
          title={page > 1 ? "Nothing on this page" : "No trips yet"}
          action={
            page > 1 ? (
              <Button variant="secondary" onClick={() => setPage(1)}>
                Back to the first page
              </Button>
            ) : (
              <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
                Plan your first trip
              </Button>
            )
          }
        >
          {page > 1 ? "This page is empty." : "Every great trip starts with a name and a date. The rest can come later."}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-10">
          <div className={`grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${trips.isPlaceholderData ? "opacity-60" : ""}`}>
            {items.map((item, i) => (
              <TripCard key={item.id} item={item} detail={details[i]?.data} index={i} />
            ))}
          </div>
          <Pagination page={page} totalPages={trips.data?.total_pages ?? 1} onChange={setPage} />
        </div>
      )}

      <TripFormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function RouteDoodle() {
  return (
    <svg
      viewBox="0 0 520 200"
      className="pointer-events-none absolute right-0 top-6 hidden h-32 w-[22rem] text-border-strong lg:block xl:w-[26rem]"
      aria-hidden
    >
      <path
        d="M10 170 C 90 150, 120 60, 210 80 S 330 170, 400 110 S 470 30, 510 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="2 9"
        strokeLinecap="round"
      />
      <g className="fill-primary">
        <circle cx="10" cy="170" r="5" />
      </g>
      <g transform="translate(210 80)">
        <circle r="11" className="fill-done-soft" />
        <circle r="5" className="fill-done" />
      </g>
      <g transform="translate(400 110)">
        <circle r="11" className="fill-planned-soft" />
        <circle r="5" className="fill-planned" />
      </g>
      <g transform="translate(510 40)">
        <path d="M0 -22c-6 0-11 4.7-11 10.6C-11 -3.4 0 6 0 6s11-9.4 11-17.4C11 -17.3 6 -22 0 -22Z" className="fill-primary" />
        <circle cy="-11.5" r="3.6" className="fill-bg" />
      </g>
    </svg>
  );
}
