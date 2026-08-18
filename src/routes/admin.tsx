import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  Radio,
  Siren,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/resq/stat-card";
import { SeverityBadge } from "@/components/resq/severity-badge";
import { EmergencyMap, type MapSelection } from "@/components/resq/emergency-map";
import { EmptyState } from "@/components/resq/states";
import {
  DISASTER_LABEL,
  demoAlerts,
  demoBlockedRoads,
  demoHospitals,
  demoShelters,
  formatTimeAgo,
  type DisasterReport,
  type ReportStatus,
  type Severity,
} from "@/data/demo";
import { useReports } from "@/lib/report-store";
import { useSosHistory } from "@/lib/sos-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Command Center — ResQAI Disaster Response Operations" },
      {
        name: "description",
        content:
          "Operations view for responders: live incident map, AI triage queue sorted by priority score, and an AI situation summary.",
      },
      { property: "og:title", content: "Command Center — ResQAI Disaster Response Operations" },
      {
        property: "og:description",
        content: "Live incident map, AI triage queue and situation summary for disaster responders.",
      },
    ],
  }),
  component: AdminPage,
});

const severityWeight: Record<Severity, number> = { critical: 92, high: 74, moderate: 52, low: 28 };

function priorityScore(report: DisasterReport) {
  return Math.min(
    100,
    Math.round(
      severityWeight[report.severity] +
        report.aiConfidence * 5 +
        Math.min(6, report.peopleAffected / 40),
    ),
  );
}

const statusTone: Record<ReportStatus, string> = {
  new: "border-critical/40 bg-critical/12 text-critical",
  verified: "border-high/40 bg-high/12 text-high",
  dispatched: "border-accent/40 bg-accent/12 text-accent",
  resolved: "border-safe/40 bg-safe/12 text-safe",
};

const statusFlow: ReportStatus[] = ["new", "verified", "dispatched", "resolved"];

function AdminPage() {
  const { reports } = useReports();
  const sosHistory = useSosHistory();
  const [overrides, setOverrides] = useState<Record<string, ReportStatus>>({});
  const [selection, setSelection] = useState<MapSelection | null>(null);

  const statusOf = (report: DisasterReport): ReportStatus =>
    overrides[report.id] ?? report.status;

  const queue = useMemo(
    () =>
      [...reports]
        .map((report) => ({ report, score: priorityScore(report) }))
        .sort((a, b) => b.score - a.score),
    [reports],
  );

  const stats = useMemo(() => {
    const active = reports.filter((report) => statusOf(report) !== "resolved");
    return {
      activeDisasters: active.length,
      criticalReports: reports.filter((report) => report.severity === "critical").length,
      peopleAffected: reports.reduce((total, report) => total + report.peopleAffected, 0),
      sheltersAvailable: demoShelters.filter((shelter) => shelter.status !== "closed").length,
      pendingSos: sosHistory.filter((alert) => alert.status !== "Acknowledged (demo)").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, overrides, sosHistory]);

  const shelterSeatsFree = demoShelters.reduce(
    (total, shelter) =>
      shelter.status === "closed" ? total : total + (shelter.capacity - shelter.occupied),
    0,
  );
  const bedsFree = demoHospitals.reduce((total, hospital) => total + hospital.bedsAvailable, 0);

  const advance = (report: DisasterReport) => {
    const current = statusOf(report);
    const next = statusFlow[Math.min(statusFlow.length - 1, statusFlow.indexOf(current) + 1)]!;
    setOverrides((prev) => ({ ...prev, [report.id]: next }));
    toast.success(`${report.id} → ${next.toUpperCase()}`, {
      description: "Status change is local to this demo session.",
    });
  };

  const assign = (report: DisasterReport) =>
    toast.info(`Team assigned to ${report.id}`, {
      description: "Simulated dispatch — no responder system is connected.",
    });

  return (
    <div className="mx-auto w-full max-w-[110rem] space-y-5 p-3 sm:p-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ops-label inline-flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" /> Disaster response command center
          </p>
          <h1 className="text-2xl font-semibold">Operations overview</h1>
        </div>
        <Badge variant="outline" className="border-border/70 bg-background/85 font-normal text-muted-foreground">
          Simulated operations data · prototype
        </Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active disasters"
          value={stats.activeDisasters.toLocaleString()}
          icon={AlertTriangle}
          tone="critical"
          hint="Unresolved incidents"
        />
        <StatCard
          label="Critical reports"
          value={stats.criticalReports.toLocaleString()}
          icon={Siren}
          tone="critical"
          hint="Severity CRITICAL"
        />
        <StatCard
          label="People affected"
          value={stats.peopleAffected.toLocaleString()}
          icon={Users}
          tone="high"
          hint="Across all reports"
        />
        <StatCard
          label="Shelters open"
          value={stats.sheltersAvailable.toLocaleString()}
          icon={Building2}
          tone="safe"
          hint={`${shelterSeatsFree} places free`}
        />
        <StatCard
          label="Pending SOS"
          value={stats.pendingSos.toLocaleString()}
          icon={Activity}
          tone="accent"
          hint="Awaiting acknowledgement"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <h2 className="ops-label">Live incident map</h2>
          <EmergencyMap
            reports={reports}
            shelters={demoShelters}
            hospitals={demoHospitals}
            roads={demoBlockedRoads}
            className="h-[26rem] sm:h-[32rem]"
            onSelect={setSelection}
          />
          <p className="text-xs text-muted-foreground">
            {selection
              ? `Selected: ${selection.kind === "disaster" ? selection.data.locationName : selection.data.name}`
              : "Select any marker to inspect the incident, shelter, hospital or blocked road."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="ops-label">AI situation summary</h2>
          <Card className="border-accent/35 bg-accent/8 p-4 shadow-panel">
            <p className="ops-label inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Generated from demo data
            </p>
            <p className="mt-2 text-sm">
              {stats.criticalReports} critical incident
              {stats.criticalReports === 1 ? "" : "s"} dominate the picture, led by the riverside
              levee breach in Dehradun East with {queue[0]?.report.peopleAffected ?? 0}+
              people affected in the top-priority zone. Approximately{" "}
              {stats.peopleAffected.toLocaleString()} people are impacted city-wide across{" "}
              {stats.activeDisasters} unresolved incidents.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                Capacity: {shelterSeatsFree} shelter places and {bedsFree} hospital beds currently
                free.
              </li>
              <li>
                Access: {demoBlockedRoads.length} routes blocked — prioritise boat evacuation for the
                riverside wards.
              </li>
              <li>
                Watch: saturated slopes above Ghat Road make secondary landslides likely in the next
                12 hours.
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              AI-generated assessment on simulated data. Verify before operational decisions.
            </p>
          </Card>

          <h2 className="ops-label">Active advisories</h2>
          <div className="space-y-2">
            {demoAlerts.map((alert) => (
              <Card key={alert.id} className="border-border/70 bg-card p-3.5 shadow-panel">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(alert.issuedAt)}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{alert.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="ops-label">AI triage queue · sorted by priority score</h2>
          <span className="text-xs text-muted-foreground">{queue.length} reports</span>
        </div>

        {queue.length === 0 ? (
          <EmptyState
            title="Triage queue is empty"
            description="New citizen reports appear here automatically, ranked by AI priority score."
          />
        ) : (
          <ul className="space-y-2">
            {queue.map(({ report, score }) => {
              const status = statusOf(report);
              return (
                <li key={report.id}>
                  <Card className="border-border/70 bg-card p-4 shadow-panel transition-colors hover:border-accent/40">
                    <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
                      <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:gap-1">
                        <span
                          className={cn(
                            "grid h-12 w-12 shrink-0 place-items-center rounded-lg border font-display text-lg",
                            score >= 85
                              ? "border-critical/40 bg-critical/12 text-critical"
                              : score >= 70
                                ? "border-high/40 bg-high/12 text-high"
                                : "border-moderate/40 bg-moderate/12 text-moderate",
                          )}
                        >
                          {score}
                        </span>
                        <span className="ops-label">Priority</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge severity={report.severity} />
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 font-display text-[0.7rem] uppercase tracking-[0.12em]",
                              statusTone[status],
                            )}
                          >
                            {status}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {report.id}
                          </span>
                        </div>
                        <h3 className="mt-1.5 truncate text-base font-semibold">{report.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {DISASTER_LABEL[report.type]} · {report.locationName} ·{" "}
                          {report.peopleAffected} affected · {formatTimeAgo(report.reportedAt)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{report.aiSummary}</p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                        <Button size="sm" onClick={() => assign(report)}>
                          Assign team
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => advance(report)}
                          disabled={status === "resolved"}
                        >
                          {status === "resolved" ? "Resolved" : "Advance status"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
