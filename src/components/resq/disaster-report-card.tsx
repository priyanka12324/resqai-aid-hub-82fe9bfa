import { Clock, MapPin, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/resq/severity-badge";
import { DISASTER_LABEL, formatTimeAgo, type DisasterReport, type ReportStatus } from "@/data/demo";
import { cn } from "@/lib/utils";

const statusLabel: Record<ReportStatus, string> = {
  new: "Awaiting Response",
  verified: "AI Verified",
  dispatched: "Team Dispatched",
  resolved: "Resolved",
};

const statusTone: Record<ReportStatus, string> = {
  new: "border-critical/40 bg-critical/12 text-critical",
  verified: "border-moderate/40 bg-moderate/12 text-moderate",
  dispatched: "border-accent/40 bg-accent/12 text-accent",
  resolved: "border-safe/40 bg-safe/12 text-safe",
};

export function DisasterReportCard({
  report,
  compact = false,
  onSelect,
}: {
  report: DisasterReport;
  compact?: boolean;
  onSelect?: (report: DisasterReport) => void;
}) {
  return (
    <Card
      onClick={onSelect ? () => onSelect(report) : undefined}
      className={cn(
        "border-border/70 bg-card p-4 shadow-panel transition-colors",
        onSelect && "cursor-pointer hover:border-primary/50 hover:bg-surface-2",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Report #{report.id}</span>
            <Badge variant="outline" className="border-border/70 text-xs font-normal">
              {DISASTER_LABEL[report.type]}
            </Badge>
          </div>
          <h3 className="mt-1 truncate text-base font-semibold">{report.title}</h3>
        </div>
        <SeverityBadge severity={report.severity} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{report.locationName}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {formatTimeAgo(report.reportedAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {report.peopleAffected} affected
        </span>
      </div>

      {!compact && (
        <div className="mt-3 rounded-lg border border-border/60 bg-surface-2/60 p-3">
          <p className="ops-label inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> AI assessment
            <span className="font-mono normal-case tracking-normal">
              {Math.round(report.aiConfidence * 100)}% confidence
            </span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">{report.aiSummary}</p>
          <p className="mt-2 text-sm">
            <span className="font-medium">Recommended: </span>
            {report.recommendedAction}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
            statusTone[report.status],
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel[report.status]}
        </span>
        <span className="font-mono text-[0.7rem] text-muted-foreground">{report.district}</span>
      </div>
    </Card>
  );
}
