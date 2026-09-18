import { keepPreviousData, useMutation, useQueries, useQueryClient, useQuery } from "@tanstack/react-query";
import { ApiError, request } from "../lib/api";
import type { GeoPoint, GeoPointCreate, GeoPointInput, GeoPointList } from "../lib/types";
import { tripKeys } from "./trips";

export const geoKeys = {
  all: ["geopoints"] as const,
  lists: () => [...geoKeys.all, "list"] as const,
  list: (page: number, perPage: number) => [...geoKeys.lists(), page, perPage] as const,
  detail: (id: number) => [...geoKeys.all, "detail", id] as const,
};

const EMPTY_LIST: GeoPointList = { geopoints: [], prev_page: null, next_page: null, total_pages: 0, total_items: 0 };

export function useGeoPoints(page: number, perPage: number) {
  return useQuery({
    queryKey: geoKeys.list(page, perPage),
    queryFn: async ({ signal }) => {
      try {
        return await request<GeoPointList>("/geopoints/", { query: { page, per_page: perPage }, signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return EMPTY_LIST;
        throw error;
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useGeoPointDetails(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: geoKeys.detail(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => request<GeoPoint>(`/geopoints/${id}/`, { signal }),
    })),
  });
}

/** A stop can belong to several trips, so every change refreshes trips and places alike. */
function useInvalidateStops() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: geoKeys.all }),
      qc.invalidateQueries({ queryKey: tripKeys.details() }),
    ]);
}

export function useCreateStop() {
  const invalidate = useInvalidateStops();
  return useMutation({
    mutationFn: (input: GeoPointCreate) => request<GeoPoint>("/geopoints/", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateStop() {
  const qc = useQueryClient();
  const invalidate = useInvalidateStops();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<GeoPointInput> }) =>
      request(`/geopoints/${id}/`, { method: "PATCH", body: patch }),
    onMutate: async ({ id, patch }) => {
      // Optimistically patch the stop wherever it's cached (trip pages and the places list).
      await qc.cancelQueries({ queryKey: tripKeys.details() });
      const snapshots = qc.getQueriesData({ queryKey: tripKeys.details() });
      qc.setQueriesData<{ geopoints: GeoPoint[] }>({ queryKey: tripKeys.details() }, (trip) =>
        trip ? { ...trip, geopoints: trip.geopoints.map((g) => (g.id === id ? { ...g, ...patch } : g)) } : trip,
      );
      const detail = qc.getQueryData<GeoPoint>(geoKeys.detail(id));
      if (detail) qc.setQueryData(geoKeys.detail(id), { ...detail, ...patch });
      return { snapshots, detail };
    },
    onError: (_error, { id }, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      if (context?.detail) qc.setQueryData(geoKeys.detail(id), context.detail);
    },
    onSettled: invalidate,
  });
}

export function useDeleteStop() {
  const qc = useQueryClient();
  const invalidate = useInvalidateStops();
  return useMutation({
    mutationFn: (id: number) => request(`/geopoints/${id}/`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: geoKeys.detail(id) });
      return invalidate();
    },
  });
}
