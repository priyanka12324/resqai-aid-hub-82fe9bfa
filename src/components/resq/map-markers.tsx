import { AlertTriangle, Construction, Home, Hospital, MapPin, Mountain, Waves } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DisasterType, Severity } from "@/data/demo";

export const disasterIcon: Record<DisasterType, typeof Waves> = {
  flood: Waves,
  landslide: Mountain,
  earthquake: AlertTriangle,
  fire: AlertTriangle,
  cyclone: Waves,
};

const severityMarker: Record<Severity, string> = {
  critical: "bg-critical/90 text-critical-foreground ring-critical/40",
  high: "bg-high/90 text-high-foreground ring-high/40",
  moderate: "bg-moderate/90 text-moderate-foreground ring-moderate/40",
  low: "bg-low/90 text-low-foreground ring-low/40",
};

interface BaseMarkerProps {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function MarkerShell({
  x,
  y,
  label,
  active,
  onClick,
  className,
  pulse,
  children,
}: BaseMarkerProps & { className?: string; pulse?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ left: `${x}%`, top: `${y}%` }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full ring-4 shadow-panel transition-transform duration-200 hover:scale-115 focus-visible:outline-none focus-visible:ring-primary",
        pulse && "pulse-ring",
        active && "scale-115 ring-8",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DisasterMarker({
  type,
  severity,
  ...rest
}: BaseMarkerProps & { type: DisasterType; severity: Severity }) {
  const Icon = disasterIcon[type];
  return (
    <MarkerShell
      {...rest}
      pulse={severity === "critical"}
      className={severityMarker[severity]}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </MarkerShell>
  );
}

export function ShelterMarker(props: BaseMarkerProps) {
  return (
    <MarkerShell {...props} className="bg-safe/90 text-safe-foreground ring-safe/35">
      <Home className="h-4 w-4" aria-hidden />
    </MarkerShell>
  );
}

export function HospitalMarker(props: BaseMarkerProps) {
  return (
    <MarkerShell {...props} className="bg-accent/90 text-accent-foreground ring-accent/35">
      <Hospital className="h-4 w-4" aria-hidden />
    </MarkerShell>
  );
}

export function BlockedRoadMarker(props: BaseMarkerProps) {
  return (
    <MarkerShell {...props} className="bg-moderate/90 text-moderate-foreground ring-moderate/35">
      <Construction className="h-4 w-4" aria-hidden />
    </MarkerShell>
  );
}

export function UserLocationMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{ left: `${x}%`, top: `${y}%` }}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
    >
      <span className="pulse-ring relative grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/30">
        <MapPin className="h-4 w-4" aria-hidden />
      </span>
    </div>
  );
}
