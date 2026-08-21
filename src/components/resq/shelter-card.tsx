import { Home, MapPin, Navigation, Phone, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Shelter } from "@/data/demo";
import { cn } from "@/lib/utils";

const statusTone: Record<Shelter["status"], string> = {
  open: "border-safe/40 bg-safe/12 text-safe",
  filling: "border-moderate/40 bg-moderate/12 text-moderate",
  full: "border-critical/40 bg-critical/12 text-critical",
  closed: "border-border/70 bg-muted/40 text-muted-foreground",
};

const statusLabel: Record<Shelter["status"], string> = {
  open: "Open",
  filling: "Almost full",
  full: "Full",
  closed: "Closed",
};

export function ShelterCard({
  shelter,
  onNavigate,
}: {
  shelter: Shelter;
  onNavigate?: () => void;
}) {
  const available = Math.max(0, shelter.capacity - shelter.occupied);
  const usage = Math.round((shelter.occupied / shelter.capacity) * 100);

  return (
    <Card className="border-border/70 bg-card p-4 shadow-panel">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-safe/30 bg-safe/12 text-safe">
          <Home className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{shelter.name}</h3>
          <p className="mt-0.5 inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {shelter.kind === "relief-camp" ? "Relief camp" : "Shelter"} · {shelter.locationName}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium",
            statusTone[shelter.status],
          )}
        >
          {statusLabel[shelter.status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2">
          <p className="ops-label">Capacity</p>
          <p className="font-display text-lg tabular-nums">{shelter.capacity}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2">
          <p className="ops-label">Occupied</p>
          <p className="font-display text-lg tabular-nums">{shelter.occupied}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2">
          <p className="ops-label">Free</p>
          <p className="font-display text-lg tabular-nums">{available}</p>
        </div>
      </div>

      <Progress value={usage} className="mt-3 h-1.5" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {usage}% occupied · {shelter.distanceKm} km away
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {shelter.facilities.map((facility) => (
          <Badge key={facility} variant="outline" className="border-border/70 font-normal">
            {facility}
          </Badge>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary" asChild>
          <a href={`tel:${shelter.contact.replace(/\s/g, "")}`}>
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

export function NearestHelpRow({
  icon: Icon,
  title,
  subtitle,
  distanceKm,
  availability,
  tone = "safe",
}: {
  icon: typeof Home;
  title: string;
  subtitle: string;
  distanceKm: number;
  availability: string;
  tone?: "safe" | "accent";
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/60 bg-surface-2/50 p-3">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
          tone === "safe"
            ? "border-safe/30 bg-safe/12 text-safe"
            : "border-accent/30 bg-accent/12 text-accent",
        )}
      >
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-base tabular-nums">{distanceKm} km</p>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" aria-hidden />
          {availability}
        </p>
      </div>
    </div>
  );
}
