import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  Lock,
  Radio,
  Shield,
  ShieldCheck,
  Siren,
  Sparkles,
  UserCheck,
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
  formatTimeAgo,
  type DisasterReport,
  type ReportStatus,
} from "@/data/demo";
import { useReports, updateReportStatusInDb } from "@/lib/report-store";
import { useFacilities } from "@/lib/facilities-store";
import { useSosHistory, updateSosStatusInDb, type DatabaseSosStatus } from "@/lib/sos-store";
import {
  computeOpsStats,
  hospitalBedsFree,
  priorityScore,
  shelterSeatsFree,
} from "@/lib/ops-metrics";
import { useAuth } from "@/lib/auth-context";
import { AuthDialog } from "@/components/resq/auth-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Command Center — ResQAI Disaster Response Operations" },
      {
        name: "description",
        content:
          "Operations view for responders: live incident map, AI triage queue sorted by priority score, and live Supabase SOS alerts.",
      },
      { property: "og:title", content: "Command Center — ResQAI Disaster Response Operations" },
      {
        property: "og:description",
        content:
          "Live incident map, AI triage queue and situation summary for disaster responders.",
      },
    ],
  }),
  component: AdminPage,
});

const statusTone: Record<ReportStatus, string> = {
  new: "border-critical/40 bg-critical/12 text-critical",
  verified: "border-high/40 bg-high/12 text-high",
  dispatched: "border-accent/40 bg-accent/12 text-accent",
  resolved: "border-safe/40 bg-safe/12 text-safe",
};

const statusFlow: ReportStatus[] = ["new", "verified", "dispatched", "resolved"];

function AdminPage() {
  const { user, role, isOperator, updateRole } = useAuth();
  const { reports, refresh: refreshReports } = useReports();
  const { shelters, hospitals } = useFacilities();
  const sosHistory = useSosHistory();
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const queue = useMemo(
    () =>
      [...reports]
        .map((report) => ({ report, score: priorityScore(report) }))
        .sort((a, b) => b.score - a.score),
    [reports],
  );

  const stats = useMemo(() => {
    return {
      ...computeOpsStats(reports),
      pendingSos: sosHistory.filter((alert) => alert.rawStatus === "pending").length,
    };
  }, [reports, sosHistory]);

  const advance = async (report: DisasterReport) => {
    const current = report.status;
    const next = statusFlow[Math.min(statusFlow.length - 1, statusFlow.indexOf(current) + 1)]!;
    const ok = await updateReportStatusInDb(report.id, next);
    if (ok) {
      toast.success(`${report.id} → ${next.toUpperCase()}`, {
        description: "Status successfully updated in Supabase.",
      });
      refreshReports();
    } else {
      toast.error("Could not update status in database");
    }
  };

  const advanceSos = async (alertId: string, current: DatabaseSosStatus) => {
    const nextMap: Record<DatabaseSosStatus, DatabaseSosStatus> = {
      pending: "acknowledged",
      acknowledged: "dispatched",
      dispatched: "resolved",
      resolved: "resolved",
    };
    const next = nextMap[current];
    const ok = await updateSosStatusInDb(alertId, next);
    if (ok) {
      toast.success(`${alertId} → ${next.toUpperCase()}`, {
        description: "SOS alert updated in Supabase.",
      });
    } else {
      toast.error("Could not update SOS alert in database");
    }
  };

  const assign = (report: DisasterReport) =>
    toast.info(`Rescue team dispatched to ${report.locationName}`, {
      description: `Incident ${report.id} priority ${priorityScore(report)}/100.`,
    });

  const elevateToResponder = async () => {
    await updateRole("responder");
    toast.success("Role elevated to Responder for this session");
  };

  // Operator Access Gate for RBAC Protection
  if (!isOperator) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
        <Card className="border-border/80 bg-card p-6 sm:p-8 text-center shadow-panel space-y-4">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Shield className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-2xl font-bold font-display uppercase tracking-wider">
              Operator &amp; Commander Access Required
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              The Command Center requires an authenticated <b>Responder</b> or <b>Admin</b> role to
              manage live incident queues, dispatch rescue teams, and update Supabase report
              statuses.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {!user ? (
              <Button onClick={() => setAuthModalOpen(true)} className="gap-2">
                <Lock className="h-4 w-4" /> Sign In as Operator
              </Button>
            ) : (
              <Button
                onClick={elevateToResponder}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <UserCheck className="h-4 w-4" /> Switch to Responder Role (RBAC)
              </Button>
            )}
          </div>
        </Card>
        <AuthDialog open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab="login" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[110rem] space-y-5 p-3 sm:p-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ops-label inline-flex items-center gap-1.5 text-accent">
            <ShieldCheck className="h-4 w-4" /> Disaster Response Command Center · Supabase Live
            Sync
          </p>
          <h1 className="text-2xl font-semibold">Operations Overview</h1>
        </div>
        <Badge variant="outline" className="border-accent/40 bg-accent/10 font-normal text-accent">
          Active Role: {role.toUpperCase()}
        </Badge>
      </header>

      {/* STATS ROW */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active Disasters"
          value={stats.activeDisasters.toLocaleString()}
          icon={AlertTriangle}
          tone="critical"
          hint="Unresolved in Supabase"
        />
        <StatCard
          label="Critical Reports"
          value={stats.criticalReports.toLocaleString()}
          icon={Siren}
          tone="critical"
          hint="Severity CRITICAL"
        />
        <StatCard
          label="People Affected"
          value={stats.peopleAffected.toLocaleString()}
          icon={Users}
          tone="high"
          hint="Across all reports"
        />
        <StatCard
          label="Shelters Open"
          value={shelters.filter((s) => s.status === "open").length.toLocaleString()}
          icon={Building2}
          tone="safe"
          hint="From Supabase facilities"
        />
        <StatCard
          label="Pending SOS"
          value={stats.pendingSos.toLocaleString()}
          icon={Activity}
          tone="accent"
          hint="Live SOS alerts"
        />
      </div>

      {/* MAP & SUMMARY GRID */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <h2 className="ops-label">Live Incident &amp; Facility Map (Leaflet / OSM)</h2>
          <EmergencyMap
            reports={reports}
            shelters={shelters}
            hospitals={hospitals}
            roads={demoBlockedRoads}
            className="h-[26rem] sm:h-[32rem]"
            onSelect={setSelection}
          />
          <p className="text-xs text-muted-foreground">
            {selection
              ? `Selected: ${selection.kind === "report" ? selection.report.locationName : selection.kind === "shelter" ? selection.shelter.name : selection.kind === "hospital" ? selection.hospital.name : selection.road.name}`
              : "Select any marker to inspect incident, shelter, hospital or blocked road."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="ops-label">Live SOS Emergency Broadcasts</h2>
          <div className="space-y-2 max-h-[32rem] overflow-y-auto">
            {sosHistory.length === 0 ? (
              <EmptyState
                icon={Siren}
                title="No active SOS signals"
                description="Live citizen SOS broadcasts from Supabase will stream here in realtime."
              />
            ) : (
              sosHistory.map((alert) => (
                <Card
                  key={alert.id}
                  className="border-critical/30 bg-critical/5 p-3.5 shadow-panel"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-critical">
                          {alert.id}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase border-critical/40 bg-critical/10 text-critical"
                        >
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium">{alert.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{alert.location}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                      <Button
                        size="sm"
                        variant={alert.rawStatus === "resolved" ? "outline" : "default"}
                        className="h-7 text-xs px-2.5"
                        onClick={() => advanceSos(alert.id, alert.rawStatus)}
                        disabled={alert.rawStatus === "resolved"}
                      >
                        {alert.rawStatus === "pending"
                          ? "Acknowledge"
                          : alert.rawStatus === "acknowledged"
                            ? "Dispatch Unit"
                            : alert.rawStatus === "dispatched"
                              ? "Mark Resolved"
                              : "Resolved"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <h2 className="ops-label mt-4">Active Advisories</h2>
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

      {/* AI TRIAGE QUEUE */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="ops-label">AI Triage Queue · Live Supabase Records</h2>
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
              const status = report.status;
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
                          Assign Team
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => advance(report)}
                          disabled={status === "resolved"}
                        >
                          {status === "resolved" ? "Resolved" : "Advance Status"}
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
