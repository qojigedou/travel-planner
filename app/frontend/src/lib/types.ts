// Mirrors the Pydantic schemas in app/backend/schemas.

export const TRIP_STATUSES = ["Planned", "Active", "Done"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const GEO_STATUSES = ["Visited", "Not Visited"] as const;
export type GeoStatus = (typeof GEO_STATUSES)[number];

export interface Paginated {
  prev_page: string | null;
  next_page: string | null;
  total_pages: number;
  total_items: number;
}

export interface GeoPoint {
  id: number;
  name: string;
  geo_latitude: number | null;
  geo_longitude: number | null;
  geo_link: string | null;
  status: GeoStatus;
  /** 0..1 */
  score: number | null;
  /** ISO date, YYYY-MM-DD */
  addition_date: string;
}

export interface GeoPointListItem {
  id: number;
  name: string;
  addition_date: string;
}

export interface GeoPointList extends Paginated {
  geopoints: GeoPointListItem[];
}

export interface GeoPointInput {
  name: string;
  geo_latitude: number | null;
  geo_longitude: number | null;
  geo_link: string | null;
  status: GeoStatus;
  score: number | null;
  addition_date: string;
}

export interface GeoPointCreate extends GeoPointInput {
  trip_id?: number | null;
}

export interface TripListItem {
  id: number;
  title: string;
  status: TripStatus;
}

export interface TripList extends Paginated {
  trips: TripListItem[];
}

export interface Trip {
  id: number;
  title: string;
  status: TripStatus;
  date: string;
  geopoints: GeoPoint[];
}

export interface TripInput {
  title: string;
  status: TripStatus;
  date: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}
