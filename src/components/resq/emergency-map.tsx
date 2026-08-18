import { useMemo, useState } from "react";
import { Layers, Maximize2, Navigation, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/resq/severity-badge";
import {
  BlockedRoadMarker,
  DisasterMarker,
  HospitalMarker,
  ShelterMarker,
  UserLocationMarker,
} from "@/components/resq/map-markers";
import {
  DISASTER_LABEL,
  formatTimeAgo,
  type BlockedRoad,
  type DisasterReport,
  type Hospital,
  type Shelter,
} from "@/data/demo";
import { cn } from "@/lib/utils";

export type MapSelection =
  | { kind: "disaster"; data: DisasterReport }
  | { kind: "shelter"; data: Shelter }
  | { kind: "hospital"; data: Hospital }
  | { kind: "road"; data: BlockedRoad };

export interface MapLayers {
  disasters: boolean;
  shelters: boolean;
  hospitals: boolean;
  roads: boolean;
}

/**
 * DEMO MAP — a schematic, offline city canvas (no tile provider configured).
 * Marker positions are normalised 0-100 coordinates so this component can be
 * swapped for a real mapping library later without touching the callers.
 */
export function EmergencyMap({
  reports,
  shelters,
  hospitals,
  roads,
  layers = { disasters: true, shelters: true, hospitals: true, roads: true },
  userLocation = { x: 44, y: 60 },
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

  const select = (next: MapSelection | null) => {
    setSelection(next);
    onSelect?.(next);
  };

  const roadPaths = useMemo(
    () =>
      roads.map((road) => ({
        road,
        mid: { x: (road.from.x + road.to.x) / 2, y: (road.from.y + road.to.y) / 2 },
      })),
    [roads],
  );

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-border/70 bg-surface shadow-panel",
        className,
      )}
    >
      {/* schematic terrain */}
      <div className="absolute inset-0 grid-backdrop opacity-70" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M-5 30 C 20 34, 30 46, 45 52 S 70 62, 105 58"
          className="fill-none stroke-accent/25"
          strokeWidth="4"
        />
        <path d="M10 -5 L 22 105" className="fill-none stroke-grid/70" strokeWidth="0.6" />
        <path d="M45 -5 L 52 105" className="fill-none stroke-grid/70" strokeWidth="0.6" />
        <path d="M78 -5 L 70 105" className="fill-none stroke-grid/70" strokeWidth="0.6" />
        <path d="M-5 22 L 105 18" className="fill-none stroke-grid/70" strokeWidth="0.6" />
        <path d="M-5 66 L 105 72" className="fill-none stroke-grid/70" strokeWidth="0.6" />
        <polygon points="55,5 92,10 88,34 60,28" className="fill-safe/8 stroke-safe/20" strokeWidth="0.4" />
        {layers.roads &&
          roads.map((road) => (
            <line
              key={road.id}
              x1={road.from.x}
              y1={road.from.y}
              x2={road.to.x}
              y2={road.to.y}
              className="stroke-moderate/80"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          ))}
      </svg>

      {/* markers */}
      <div className="absolute inset-0">
        {layers.disasters &&
          reports.map((report) => (
            <DisasterMarker
              key={report.id}
              x={report.point.x}
              y={report.point.y}
              type={report.type}
              severity={report.severity}
              label={`${DISASTER_LABEL[report.type]} — ${report.locationName}`}
              active={selection?.kind === "disaster" && selection.data.id === report.id}
              onClick={() => select({ kind: "disaster", data: report })}
            />
          ))}
        {layers.shelters &&
          shelters.map((shelter) => (
            <ShelterMarker
              key={shelter.id}
              x={shelter.point.x}
              y={shelter.point.y}
              label={`Shelter — ${shelter.name}`}
              active={selection?.kind === "shelter" && selection.data.id === shelter.id}
              onClick={() => select({ kind: "shelter", data: shelter })}
            />
          ))}
        {layers.hospitals &&
          hospitals.map((hospital) => (
            <HospitalMarker
              key={hospital.id}
              x={hospital.point.x}
              y={hospital.point.y}
              label={`Hospital — ${hospital.name}`}
              active={selection?.kind === "hospital" && selection.data.id === hospital.id}
              onClick={() => select({ kind: "hospital", data: hospital })}
            />
          ))}
        {layers.roads &&
          roadPaths.map(({ road, mid }) => (
            <BlockedRoadMarker
              key={road.id}
              x={mid.x}
              y={mid.y}
              label={`Blocked road — ${road.name}`}
              active={selection?.kind === "road" && selection.data.id === road.id}
              onClick={() => select({ kind: "road", data: road })}
            />
          ))}
        <UserLocationMarker x={userLocation.x} y={userLocation.y} />
      </div>

      {/* demo notice */}
      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
        <Badge className="border-border/70 bg-background/85 font-normal text-muted-foreground" variant="outline">
          <Layers className="mr-1 h-3.5 w-3.5" /> Demo map · simulated data, not real-time
        </Badge>
      </div>

      {showLegend && <MapLegend className="absolute bottom-3 left-3 hidden sm:block" />}

      {selection && (
        <MapPopup selection={selection} onClose={() => select(null)} />
      )}
    </div>
  );
}

export function MapLegend({ className }: { className?: string }) {
  const items = [
    { color: "bg-critical", label: "Active disaster zone" },
    { color: "bg-high", label: "High-risk area" },
    { color: "bg-safe", label: "Shelter / relief camp" },
    { color: "bg-accent", label: "Hospital" },
    { color: "bg-moderate", label: "Blocked road" },
    { color: "bg-primary", label: "Your location" },
  ];
  return (
    <div
      className={cn(
        "max-w-[15rem] rounded-lg border border-border/70 bg-background/90 p-3 backdrop-blur",
        className,
      )}
    >
      <p className="ops-label">Legend</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.color)} />
            <span className="truncate">{item.label}</span>
          </li>
        ))}
      </ul>
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

function MapPopup({ selection, onClose }: { selection: MapSelection; onClose: () => void }) {
  return (
    <Card className="absolute right-3 top-3 z-10 w-[min(20rem,calc(100%-1.5rem))] border-border/70 bg-background/95 p-4 shadow-panel backdrop-blur">
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
            {selection.kind === "disaster"
              ? selection.data.locationName
              : selection.kind === "road"
                ? selection.data.name
                : selection.data.name}
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose} aria-label="Close details">
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

      <Button size="sm" className="mt-3 w-full">
        {selection.kind === "disaster" ? (
          <>
            <Maximize2 className="h-4 w-4" /> View safety guidance
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4" /> Get directions
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
        Demo action — no external routing service connected.
      </p>
    </Card>
  );
}
