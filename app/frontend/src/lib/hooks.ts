import { useCallback, useSyncExternalStore } from "react";
import { tokenStore } from "./tokenStore";

export function useSession() {
  return useSyncExternalStore(tokenStore.subscribe, tokenStore.get, tokenStore.get);
}

type Theme = "light" | "dark";
const THEME_KEY = "waypoint.theme";
const themeListeners = new Set<() => void>();

const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function useTheme() {
  const theme = useSyncExternalStore(
    (listener) => {
      themeListeners.add(listener);
      return () => themeListeners.delete(listener);
    },
    getTheme,
    () => "light" as Theme,
  );

  const toggle = useCallback(() => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
    themeListeners.forEach((listener) => listener());
  }, []);

  return { theme, toggle };
}

/** Pull "@lat,lng" or "?q=lat,lng" coordinates out of a Google/Apple/OSM maps link. */
export function coordsFromMapLink(link: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|center)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /[#&]map=\d+\/(-?\d{1,2}\.\d+)\/(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
  ];
  for (const pattern of patterns) {
    const match = decodeURIComponent(link).match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}
