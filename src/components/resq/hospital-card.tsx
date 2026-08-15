import { Activity, BedDouble, HeartPulse, Hospital, MapPin, Navigation, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Hospital as HospitalType } from "@/data/demo";
import { cn } from "@/lib/utils";

const loadTone: Record<HospitalType["triageLoad"], string> = {
  normal: "border-safe/40 bg-safe/12 text-safe",
  busy: "border-moderate/40 bg-moderate/12 text-moderate",
  overloaded: "border-critical/40 bg-critical/12 text-critical",
};

const loadLabel: Record<HospitalType["triageLoad"], string> = {
  normal: "Emergency open",
  busy: "Emergency busy",
  overloaded: "Emergency overloaded",
};

export function HospitalCard({
  hospital,
  onNavigate,
}: {
  hospital: HospitalType;
  onNavigate?: () => void;
}) {
  return (
    <Card className="border-border/70 bg-card p-4 shadow-panel">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/12 text-accent">
          <Hospital className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{hospital.name}</h3>
          <p className="mt-0.5 inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{hospital.locationName}</span>
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium",
            loadTone[hospital.triageLoad],
          )}
        >
          {loadLabel[hospital.triageLoad]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2">
          <p className="ops-label inline-flex items-center gap-1">
            <BedDouble className="h-3 w-3" aria-hidden /> Beds
          </p>
          <p className="font-display text-lg tabular-nums">{hospital.bedsAvailable}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2">
          <p className="ops-label inline-flex items-center gap-1">
            <HeartPulse className="h-3 w-3" aria-hidden /> ICU
          </p>
          <p className="font-display text-lg tabular-nums">{hospital.icuAvailable}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2">
          <p className="ops-label inline-flex items-center gap-1">
            <Activity className="h-3 w-3" aria-hidden /> Distance
          </p>
          <p className="font-display text-lg tabular-nums">{hospital.distanceKm}km</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {hospital.specialties.map((item) => (
          <Badge key={item} variant="outline" className="border-border/70 font-normal">
            {item}
          </Badge>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary" asChild>
          <a href={`tel:${hospital.contact.replace(/\s/g, "")}`}>
            <Phone className="h-4 w-4" /> Call
          </a>
        </Button>
        <Button size="sm" onClick={onNavigate}>
          <Navigation className="h-4 w-4" /> Directions
        </Button>
      </div>
    </Card>
  );
}
