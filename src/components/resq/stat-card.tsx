import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTone = "critical" | "high" | "safe" | "accent";

const toneRing: Record<StatTone, string> = {
  critical: "text-critical bg-critical/12 border-critical/30",
  high: "text-high bg-high/12 border-high/30",
  safe: "text-safe bg-safe/12 border-safe/30",
  accent: "text-accent bg-accent/12 border-accent/30",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "accent",
  delta,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatTone;
  delta?: { value: string; direction: "up" | "down" };
  hint?: string;
}) {
  const DeltaIcon = delta?.direction === "down" ? TrendingDown : TrendingUp;
  return (
    <Card className="relative overflow-hidden border-border/70 bg-card p-4 shadow-panel">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl opacity-40",
          tone === "critical" && "bg-critical/40",
          tone === "high" && "bg-high/40",
          tone === "safe" && "bg-safe/40",
          tone === "accent" && "bg-accent/40",
        )}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="ops-label truncate">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold leading-none tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg border", toneRing[tone])}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      {(delta || hint) && (
        <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                delta.direction === "up" ? "text-critical" : "text-safe",
              )}
            >
              <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
              {delta.value}
            </span>
          )}
          {hint && <span className="truncate">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
