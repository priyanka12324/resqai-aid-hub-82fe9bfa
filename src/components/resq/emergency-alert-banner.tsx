import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Severity } from "@/data/demo";

const tone: Record<Severity, string> = {
  critical: "border-critical/45 bg-critical/12",
  high: "border-high/45 bg-high/12",
  moderate: "border-moderate/45 bg-moderate/12",
  low: "border-low/45 bg-low/12",
};

const iconTone: Record<Severity, string> = {
  critical: "text-critical",
  high: "text-high",
  moderate: "text-moderate",
  low: "text-low",
};

export function EmergencyAlertBanner({
  severity = "critical",
  title,
  message,
  meta,
  actionLabel,
  actionTo,
  className,
}: {
  severity?: Severity;
  title: string;
  message: string;
  meta?: string;
  actionLabel?: string;
  actionTo?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden rounded-xl border px-4 py-3.5 shadow-panel sm:px-5",
        tone[severity],
        className,
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 lg:flex lg:items-center">
        <span className={cn("relative mt-0.5 shrink-0", iconTone[severity])}>
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold uppercase tracking-[0.08em] sm:text-lg">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>
          {meta && <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground/80">{meta}</p>}
        </div>
        {actionLabel && actionTo && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="col-span-2 lg:col-span-1 lg:ml-auto"
          >
            <Link to={actionTo}>
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
