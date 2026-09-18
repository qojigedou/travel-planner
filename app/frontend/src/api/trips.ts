import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, request } from "../lib/api";
import type { Trip, TripInput, TripList } from "../lib/types";

export const tripKeys = {
  all: ["trips"] as const,
  lists: () => [...tripKeys.all, "list"] as const,
  list: (page: number, perPage: number) => [...tripKeys.lists(), page, perPage] as const,
  details: () => [...tripKeys.all, "detail"] as const,
  detail: (id: number) => [...tripKeys.details(), id] as const,
};

const EMPTY_LIST: TripList = { trips: [], prev_page: null, next_page: null, total_pages: 0, total_items: 0 };

async function fetchTrips(page: number, perPage: number, signal?: AbortSignal) {
  try {
    return await request<TripList>("/trips/", { query: { page, per_page: perPage }, signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return EMPTY_LIST;
    throw error;
  }
}

export const fetchTrip = (id: number, signal?: AbortSignal) => request<Trip>(`/trips/${id}/`, { signal });

export function useTrips(page: number, perPage: number) {
  return useQuery({
    queryKey: tripKeys.list(page, perPage),
    queryFn: ({ signal }) => fetchTrips(page, perPage, signal),
    placeholderData: keepPreviousData,
  });
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: ({ signal }) => fetchTrip(id, signal),
    enabled: Number.isFinite(id),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

export function useTripDetails(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: tripKeys.detail(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchTrip(id, signal),
    })),
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    // Stops are added afterwards through /geopoints/ (see useCreateStop).
    mutationFn: (input: TripInput) => request<Trip>("/trips/", { method: "POST", body: { ...input, geopoints: [] } }),
    onSuccess: (trip) => {
      qc.setQueryData(tripKeys.detail(trip.id), trip);
      return qc.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useUpdateTrip(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<TripInput>) => request(`/trips/${id}/`, { method: "PATCH", body: patch }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: tripKeys.detail(id) });
      const previous = qc.getQueryData<Trip>(tripKeys.detail(id));
      if (previous) qc.setQueryData<Trip>(tripKeys.detail(id), { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) qc.setQueryData(tripKeys.detail(id), context.previous);
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: tripKeys.detail(id) }),
        qc.invalidateQueries({ queryKey: tripKeys.lists() }),
      ]),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request(`/trips/${id}/`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: tripKeys.detail(id) });
      return qc.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}
