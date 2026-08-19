import type { MapPoint } from "@/data/demo";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * The demo dataset stores normalised 0-100 schematic coordinates.
 * We project them into a real bounding box around Dehradun so the same
 * simulated incidents can be shown on a real Google map.
 */
export const CITY_BOUNDS = {
  north: 30.404,
  south: 30.252,
  west: 77.948,
  east: 78.152,
};

export const CITY_CENTER: LatLng = {
  lat: (CITY_BOUNDS.north + CITY_BOUNDS.south) / 2,
  lng: (CITY_BOUNDS.west + CITY_BOUNDS.east) / 2,
};

export function pointToLatLng(point: MapPoint): LatLng {
  return {
    lat: CITY_BOUNDS.north - (point.y / 100) * (CITY_BOUNDS.north - CITY_BOUNDS.south),
    lng: CITY_BOUNDS.west + (point.x / 100) * (CITY_BOUNDS.east - CITY_BOUNDS.west),
  };
}

export function latLngToPoint(coord: LatLng): MapPoint {
  return {
    x: ((coord.lng - CITY_BOUNDS.west) / (CITY_BOUNDS.east - CITY_BOUNDS.west)) * 100,
    y: ((CITY_BOUNDS.north - coord.lat) / (CITY_BOUNDS.north - CITY_BOUNDS.south)) * 100,
  };
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}
