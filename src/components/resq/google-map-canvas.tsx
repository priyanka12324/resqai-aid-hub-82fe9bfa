import { useEffect, useRef, useState } from "react";

import { CITY_CENTER, pointToLatLng, type LatLng } from "@/lib/geo";
import { GOOGLE_MAPS_BROWSER_KEY, loadGoogleMaps } from "@/lib/google-maps-loader";
import type { BlockedRoad, DisasterReport, Hospital, Severity, Shelter } from "@/data/demo";
import { DISASTER_LABEL } from "@/data/demo";
import type { MapSelection } from "@/components/resq/map-selection";

/** Canvas API colours — Google Maps overlays cannot read CSS custom properties. */
const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#f0393f",
  high: "#f97316",
  moderate: "#eab308",
  low: "#38bdf8",
};

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1b2027" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b95a3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#12161b" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a313a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a434f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#101820" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1f2731" }] },
];

function pin(color: string, scale = 9): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#0c1014",
    strokeWeight: 3,
  };
}

export interface GoogleMapCanvasProps {
  reports: DisasterReport[];
  shelters: Shelter[];
  hospitals: Hospital[];
  roads: BlockedRoad[];
  selection: MapSelection | null;
  onSelect: (selection: MapSelection | null) => void;
  userLocation: LatLng | null;
  routePolyline: string | null;
  focus: { coord: LatLng; key: number } | null;
}

export default function GoogleMapCanvas({
  reports,
  shelters,
  hospitals,
  roads,
  selection,
  onSelect,
  userLocation,
  routePolyline,
  focus,
}: GoogleMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const linesRef = useRef<google.maps.Polyline[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest select handler without re-creating markers.
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: CITY_CENTER,
          zoom: 13,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          styles: DARK_STYLE,
        });
        mapRef.current.addListener("click", () => selectRef.current(null));
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Map failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Incident / facility markers + blocked road lines.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    linesRef.current.forEach((line) => line.setMap(null));
    markersRef.current = [];
    linesRef.current = [];

    const add = (
      position: LatLng,
      title: string,
      icon: google.maps.Symbol,
      onClick: () => void,
      zIndex = 1,
    ) => {
      const marker = new google.maps.Marker({ position, map, title, icon, zIndex });
      marker.addListener("click", onClick);
      markersRef.current.push(marker);
    };

    reports.forEach((report) =>
      add(
        pointToLatLng(report.point),
        `${DISASTER_LABEL[report.type]} — ${report.locationName}`,
        pin(SEVERITY_COLOR[report.severity], report.severity === "critical" ? 12 : 10),
        () => selectRef.current({ kind: "disaster", data: report }),
        report.severity === "critical" ? 6 : 5,
      ),
    );

    shelters.forEach((shelter) =>
      add(
        pointToLatLng(shelter.point),
        `Shelter — ${shelter.name}`,
        pin("#22c55e"),
        () => selectRef.current({ kind: "shelter", data: shelter }),
        4,
      ),
    );

    hospitals.forEach((hospital) =>
      add(
        pointToLatLng(hospital.point),
        `Hospital — ${hospital.name}`,
        pin("#38bdf8"),
        () => selectRef.current({ kind: "hospital", data: hospital }),
        4,
      ),
    );

    roads.forEach((road) => {
      const from = pointToLatLng(road.from);
      const to = pointToLatLng(road.to);
      const line = new google.maps.Polyline({
        map,
        path: [from, to],
        strokeColor: SEVERITY_COLOR[road.severity],
        strokeOpacity: 0,
        icons: [
          {
            icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, scale: 3 },
            offset: "0",
            repeat: "12px",
          },
        ],
      });
      line.addListener("click", () => selectRef.current({ kind: "road", data: road }));
      linesRef.current.push(line);

      add(
        { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 },
        `Blocked road — ${road.name}`,
        pin(SEVERITY_COLOR[road.severity], 7),
        () => selectRef.current({ kind: "road", data: road }),
        3,
      );
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      linesRef.current.forEach((line) => line.setMap(null));
      markersRef.current = [];
      linesRef.current = [];
    };
  }, [ready, reports, shelters, hospitals, roads]);

  // Live user location marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (!userLocation) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }
    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position: userLocation,
        title: "Your location",
        zIndex: 10,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }
  }, [ready, userLocation]);

  // Route overlay.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    routeLineRef.current?.setMap(null);
    routeLineRef.current = null;
    if (!routePolyline) return;

    const path = google.maps.geometry.encoding.decodePath(routePolyline);
    routeLineRef.current = new google.maps.Polyline({
      map,
      path,
      strokeColor: "#3b82f6",
      strokeOpacity: 0.95,
      strokeWeight: 5,
      zIndex: 2,
    });
    const bounds = new google.maps.LatLngBounds();
    path.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 64);
  }, [ready, routePolyline]);

  // Pan to a requested target (selection, recenter button).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus) return;
    map.panTo(focus.coord);
    if ((map.getZoom() ?? 13) < 14) map.setZoom(15);
  }, [ready, focus]);

  // Highlight the selected marker.
  useEffect(() => {
    if (!ready) return;
    markersRef.current.forEach((marker) => marker.setAnimation(null));
    if (!selection) return;
    const title = markersRef.current.find((marker) =>
      marker.getTitle()?.includes(
        selection.kind === "disaster" ? selection.data.locationName : selection.data.name,
      ),
    );
    title?.setAnimation(google.maps.Animation.BOUNCE);
    const timer = window.setTimeout(() => title?.setAnimation(null), 1400);
    return () => window.clearTimeout(timer);
  }, [ready, selection]);

  if (!GOOGLE_MAPS_BROWSER_KEY || error) {
    return (
      <div className="grid h-full w-full place-items-center bg-surface p-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          {error ?? "Google Maps is not configured for this environment."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-surface">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading live map…
          </div>
        </div>
      )}
    </>
  );
}
