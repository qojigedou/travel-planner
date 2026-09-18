import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useTheme } from "../../lib/hooks";
import type { GeoPoint } from "../../lib/types";

interface StopsMapProps {
  stops: { stop: GeoPoint; number: number }[];
  highlightedId?: number | null;
}

// Keyless OSM tiles; the dark theme recolours them with a CSS filter (see .wp-map-dark in index.css).
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function markerIcon(number: number, visited: boolean, highlighted: boolean) {
  const color = visited ? "var(--status-done)" : "var(--primary)";
  const size = highlighted ? 38 : 30;
  return L.divIcon({
    className: "",
    html: `<div class="wp-marker" style="background:${color};width:${size}px;height:${size}px;transition:all .2s"><span>${number}</span></div>`,
    iconSize: [size, size],
    // The pin is a rotated square; its tip sits half a diagonal below the centre.
    iconAnchor: [size / 2, size / 2 + size * Math.SQRT1_2],
    popupAnchor: [0, -size * 0.9],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(points, { padding: [48, 48], maxZoom: 14 });
  }, [key, map]); // `key` captures the points; the array identity changes every render

  return null;
}

export default function StopsMap({ stops, highlightedId }: StopsMapProps) {
  const { theme } = useTheme();
  const points = useMemo(
    () => stops.map(({ stop }) => [stop.geo_latitude!, stop.geo_longitude!] as [number, number]),
    [stops],
  );

  return (
    // MapContainer ignores className changes after mount, so the theme class lives on a wrapper.
    <div className={theme === "dark" ? "wp-map-dark size-full" : "size-full"}>
      <MapContainer center={points[0] ?? [20, 0]} zoom={points.length ? 12 : 2} scrollWheelZoom={false} className="size-full">
        <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
        <FitBounds points={points} />
        {stops.map(({ stop, number }) => (
          <Marker
            key={stop.id}
            position={[stop.geo_latitude!, stop.geo_longitude!]}
            icon={markerIcon(number, stop.status === "Visited", stop.id === highlightedId)}
            zIndexOffset={stop.id === highlightedId ? 1000 : 0}
          >
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              <span style={{ color: "var(--fg-muted)" }}>{stop.status === "Visited" ? "Visited" : "To visit"}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
