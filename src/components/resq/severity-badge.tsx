import { AlertTriangle, Info, ShieldAlert, Siren } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Severity } from "@/data/demo";
import { SEVERITY_LABEL } from "@/data/demo";

const severityStyles: Record<Severity, string> = {
  critical: "bg-critical/15 text-critical border-critical/40",
  high: "bg-high/15 text-high border-high/40",
  moderate: "bg-moderate/15 text-moderate border-moderate/40",
  low: "bg-low/15 text-low border-low/40",
};

const severityIcons: Record<Severity, typeof Siren> = {
  critical: Siren,
  high: ShieldAlert,
  moderate: AlertTriangle,
  low: Info,
};

export function SeverityBadge({
  severity,
  className,
  showIcon = true,
}: {
  severity: Severity;
  className?: string;
  showIcon?: boolean;
}) {
  const Icon = severityIcons[severity];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[0.7rem] uppercase tracking-[0.12em]",
        severityStyles[severity],
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function severityDotClass(severity: Severity) {
  return {
    critical: "bg-critical text-critical",
    high: "bg-high text-high",
    moderate: "bg-moderate text-moderate",
    low: "bg-low text-low",
  }[severity];
}
