import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Crosshair, Layers, Loader2, Maximize2, Navigation, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/resq/severity-badge";
import {
  ALL_LEGEND_KEYS,
  LEGEND_ITEMS,
  type LegendKey,
  type MapSelection,
} from "@/components/resq/map-selection";
import {
  DISASTER_LABEL,
  formatTimeAgo,
  type BlockedRoad,
  type DisasterReport,
  type Hospital,
  type Shelter,
} from "@/data/demo";
import {
  CITY_CENTER,
  formatDistance,
  formatDuration,
  pointToLatLng,
  type LatLng,
} from "@/lib/geo";
import { computeRoute, type RouteResult } from "@/lib/directions.functions";
import { cn } from "@/lib/utils";

export type { MapSelection } from "@/components/resq/map-selection";

const GoogleMapCanvas = lazy(() => import("@/components/resq/google-map-canvas"));

export interface MapLayers {
  disasters: boolean;
  shelters: boolean;
  hospitals: boolean;
  roads: boolean;
}

/**
 * Live Google-Maps-backed emergency map. Marker clicks open a details popup,
 * legend entries toggle what is displayed, the browser's geolocation can be
 * tracked, and directions are fetched on demand from the Routes API.
 */
export function EmergencyMap({
  reports,
  shelters,
  hospitals,
  roads,
  layers = { disasters: true, shelters: true, hospitals: true, roads: true },
  className,
  onSelect,
  showLegend = true,
}: {
  reports: DisasterReport[];
  shelters: Shelter[];
  hospitals: Hospital[];
  roads: BlockedRoad[];
  layers?: MapLayers;
  userLocation?: { x: number; y: number };
  className?: string;
  onSelect?: (selection: MapSelection | null) => void;
  showLegend?: boolean;
}) {
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [hidden, setHidden] = useState<LegendKey[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ coord: LatLng; key: number } | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLabel, setRouteLabel] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  const getRoute = useServerFn(computeRoute);

  const isVisible = useCallback((key: LegendKey) => !hidden.includes(key), [hidden]);

  const toggleLegend = (key: LegendKey) =>
    setHidden((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));

  const visibleReports = useMemo(
    () => (layers.disasters ? reports.filter((report) => isVisible(report.severity)) : []),
    [layers.disasters, reports, isVisible],
  );
  const visibleShelters = useMemo(
    () => (layers.shelters && isVisible("shelters") ? shelters : []),
    [layers.shelters, shelters, isVisible],
  );
  const visibleHospitals = useMemo(
    () => (layers.hospitals && isVisible("hospitals") ? hospitals : []),
    [layers.hospitals, hospitals, isVisible],
  );
  const visibleRoads = useMemo(
    () => (layers.roads && isVisible("roads") ? roads : []),
    [layers.roads, roads, isVisible],
  );

  const select = (next: MapSelection | null) => {
    setSelection(next);
    setRouteError(null);
    onSelect?.(next);
    if (next) {
      const coord =
        next.kind === "road"
          ? {
              lat: (pointToLatLng(next.data.from).lat + pointToLatLng(next.data.to).lat) / 2,
              lng: (pointToLatLng(next.data.from).lng + pointToLatLng(next.data.to).lng) / 2,
            }
          : pointToLatLng(next.data.point);
      setFocus({ coord, key: Date.now() });
    }
  };

  useEffect(
    () => () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    },
    [],
  );

  const toggleTracking = () => {
    if (tracking) {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setTracking(false);
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationError("Location is not available in this browser.");
      return;
    }
    setLocationError(null);
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coord = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coord);
        setFocus({ coord, key: Date.now() });
      },
      () => {
        setLocationError("Location permission denied — using the city centre instead.");
        setUserLocation(CITY_CENTER);
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  };

  const requestDirections = async (target: MapSelection) => {
    const destination =
      target.kind === "road" ? pointToLatLng(target.data.from) : pointToLatLng(target.data.point);
    const origin = userLocation ?? CITY_CENTER;
    setRouting(true);
    setRouteError(null);
    try {
      const result = await getRoute({ data: { origin, destination, mode: "DRIVE" } });
      setRoute(result);
      setRouteLabel(target.kind === "disaster" ? target.data.locationName : target.data.name);
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : "Could not calculate a route.");
    } finally {
      setRouting(false);
    }
  };

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-border/70 bg-surface shadow-panel",
        className,
      )}
    >
      <ClientOnly
        fallback={
          <div className="grid h-full w-full place-items-center bg-surface text-sm text-muted-foreground">
            Preparing map…
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="grid h-full w-full place-items-center bg-surface text-sm text-muted-foreground">
              Loading live map…
            </div>
          }
        >
          <GoogleMapCanvas
            reports={visibleReports}
            shelters={visibleShelters}
            hospitals={visibleHospitals}
            roads={visibleRoads}
            selection={selection}
            onSelect={select}
            userLocation={userLocation}
            routePolyline={route?.encodedPolyline ?? null}
            focus={focus}
          />
        </Suspense>
      </ClientOnly>

      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2">
        <Badge
          className="border-border/70 bg-background/85 font-normal text-muted-foreground"
          variant="outline"
        >
          <Layers className="mr-1 h-3.5 w-3.5" /> Live map · simulated incident data
        </Badge>
        <Button
          size="sm"
          variant={tracking ? "default" : "secondary"}
          className="pointer-events-auto h-7 px-2.5 text-xs"
          onClick={toggleTracking}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {tracking ? "Tracking location" : "Track my location"}
        </Button>
      </div>

      {(locationError ?? route) && (
        <div className="absolute bottom-3 right-3 z-10 max-w-[16rem] rounded-lg border border-border/70 bg-background/90 p-3 text-xs backdrop-blur">
          {locationError && <p className="text-muted-foreground">{locationError}</p>}
          {route && (
            <div className={cn(locationError && "mt-2")}>
              <p className="ops-label">Route to {routeLabel}</p>
              <p className="mt-1 font-medium">
                {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-7 px-2 text-xs"
                onClick={() => {
                  setRoute(null);
                  setRouteLabel(null);
                }}
              >
                Clear route
              </Button>
            </div>
          )}
        </div>
      )}

      {showLegend && (
        <MapLegend
          className="absolute bottom-3 left-3 hidden sm:block"
          hidden={hidden}
          onToggle={toggleLegend}
        />
      )}

      {selection && (
        <MapPopup
          selection={selection}
          onClose={() => select(null)}
          onDirections={() => void requestDirections(selection)}
          routing={routing}
          error={routeError}
        />
      )}
    </div>
  );
}

export function MapLegend({
  className,
  hidden = [],
  onToggle,
}: {
  className?: string;
  hidden?: LegendKey[];
  onToggle?: (key: LegendKey) => void;
}) {
  const interactive = Boolean(onToggle);
  return (
    <div
      className={cn(
        "max-w-[15rem] rounded-lg border border-border/70 bg-background/90 p-3 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="ops-label">Legend</p>
        {interactive && hidden.length > 0 && (
          <button
            type="button"
            className="text-[0.65rem] uppercase tracking-wide text-primary hover:underline"
            onClick={() => ALL_LEGEND_KEYS.filter((key) => hidden.includes(key)).forEach(onToggle!)}
          >
            Reset
          </button>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {LEGEND_ITEMS.map((item) => {
          const off = hidden.includes(item.key);
          const content = (
            <>
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.color, off && "opacity-30")}
              />
              <span className={cn("truncate", off && "line-through opacity-50")}>{item.label}</span>
            </>
          );
          return (
            <li key={item.key}>
              {interactive ? (
                <button
                  type="button"
                  aria-pressed={!off}
                  onClick={() => onToggle?.(item.key)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2 px-1 py-0.5 text-xs text-muted-foreground">
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {interactive && (
        <p className="mt-2 text-[0.65rem] text-muted-foreground/80">Click an item to filter</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
      <span className="ops-label">{label}</span>
      <span className="min-w-0 truncate text-sm">{value}</span>
    </div>
  );
}

function MapPopup({
  selection,
  onClose,
  onDirections,
  routing,
  error,
}: {
  selection: MapSelection;
  onClose: () => void;
  onDirections: () => void;
  routing: boolean;
  error: string | null;
}) {
  return (
    <Card className="absolute right-3 top-3 z-10 w-[min(20rem,calc(100%-1.5rem))] animate-in fade-in slide-in-from-top-2 border-border/70 bg-background/95 p-4 shadow-panel backdrop-blur duration-200">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <p className="ops-label">
            {selection.kind === "disaster"
              ? "Disaster zone"
              : selection.kind === "shelter"
                ? "Shelter"
                : selection.kind === "hospital"
                  ? "Hospital"
                  : "Blocked road"}
          </p>
          <h3 className="truncate text-base font-semibold">
            {selection.kind === "disaster" ? selection.data.locationName : selection.data.name}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-2">
        {selection.kind === "disaster" && (
          <>
            <div className="mb-2">
              <SeverityBadge severity={selection.data.severity} />
            </div>
            <Row label="Type" value={DISASTER_LABEL[selection.data.type]} />
            <Row label="Affected people" value={`${selection.data.peopleAffected}`} />
            <Row label="Status" value={selection.data.status.toUpperCase()} />
            <Row label="Last updated" value={formatTimeAgo(selection.data.reportedAt)} />
            <p className="mt-2 text-xs text-muted-foreground">{selection.data.recommendedAction}</p>
          </>
        )}
        {selection.kind === "shelter" && (
          <>
            <Row label="Capacity" value={`${selection.data.capacity}`} />
            <Row label="Occupancy" value={`${selection.data.occupied}`} />
            <Row
              label="Available seats"
              value={`${Math.max(0, selection.data.capacity - selection.data.occupied)}`}
            />
            <Row label="Status" value={selection.data.status.toUpperCase()} />
            <Row label="Distance" value={`${selection.data.distanceKm} km`} />
          </>
        )}
        {selection.kind === "hospital" && (
          <>
            <Row label="Emergency" value={selection.data.triageLoad.toUpperCase()} />
            <Row label="Beds free" value={`${selection.data.bedsAvailable}`} />
            <Row label="ICU free" value={`${selection.data.icuAvailable}`} />
            <Row label="Distance" value={`${selection.data.distanceKm} km`} />
          </>
        )}
        {selection.kind === "road" && (
          <>
            <div className="mb-2">
              <SeverityBadge severity={selection.data.severity} />
            </div>
            <Row label="Reason" value={selection.data.reason} />
            <Row label="Updated" value={formatTimeAgo(selection.data.updatedAt)} />
          </>
        )}
      </div>

      <Button size="sm" className="mt-3 w-full" onClick={onDirections} disabled={routing}>
        {routing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Calculating route…
          </>
        ) : selection.kind === "disaster" ? (
          <>
            <Maximize2 className="h-4 w-4" /> Route to this zone
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4" /> Get directions
          </>
        )}
      </Button>
      {error ? (
        <p className="mt-2 text-center text-[0.7rem] text-critical">{error}</p>
      ) : (
        <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
          Driving route from your tracked location (city centre if location is off).
        </p>
      )}
    </Card>
  );
}
