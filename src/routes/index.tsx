import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Home,
  Hospital,
  Radio,
  Siren,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmergencyAlertBanner } from "@/components/resq/emergency-alert-banner";
import { StatCard } from "@/components/resq/stat-card";
import { EmergencyMap } from "@/components/resq/emergency-map";
import { DisasterReportCard } from "@/components/resq/disaster-report-card";
import { NearestHelpRow } from "@/components/resq/shelter-card";
import { SosButton } from "@/components/resq/sos-button";
import { EmptyState } from "@/components/resq/states";
import { SeverityBadge } from "@/components/resq/severity-badge";
import {
  demoAlerts,
  demoBlockedRoads,
  demoHospitals,
  demoShelters,
  formatTimeAgo,
} from "@/data/demo";
import { useReports } from "@/lib/report-store";
import { useFacilities } from "@/lib/facilities-store";
import { computeOpsStats } from "@/lib/ops-metrics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResQAI Dashboard — Live Disaster Response Overview" },
      {
        name: "description",
        content:
          "Monitor active disasters, critical citizen reports, shelter capacity and nearby help on the ResQAI response dashboard.",
      },
      { property: "og:title", content: "ResQAI Dashboard — Live Disaster Response Overview" },
      {
        property: "og:description",
        content:
          "Active disasters, critical reports, shelters and hospitals in one AI-assisted emergency console.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { reports } = useReports();
  const { shelters, hospitals } = useFacilities();
  const stats = computeOpsStats(reports);
  const criticalReports = reports.filter(
    (report) => report.severity === "critical" || report.severity === "high",
  );
  const nearestShelter =
    [...shelters]
      .filter((shelter) => shelter.status !== "full" && shelter.status !== "closed")
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] ??
    shelters[0] ??
    demoShelters[0];
  const nearestHospital =
    [...hospitals].sort((a, b) => a.distanceKm - b.distanceKm)[0] ??
    hospitals[0] ??
    demoHospitals[0];

  return (
    <div className="mx-auto w-full max-w-[110rem] space-y-5 p-3 sm:p-5">
      <h1 className="sr-only">ResQAI disaster response dashboard</h1>

      <EmergencyAlertBanner
        title="Active disaster — heavy rainfall and flooding reported"
        message="Level 3 response active across Dehradun East and North Hills. Vertical evacuation advised in Riverside Colony wards 3-5."
        meta="Simulated district control room · updated 5m ago"
        actionLabel="Open emergency map"
        actionTo="/emergency-map"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active disasters"
          value={String(stats.activeDisasters)}
          icon={TriangleAlert}
          tone="critical"
          hint="Unresolved incidents"
        />
        <StatCard
          label="Critical reports"
          value={String(stats.criticalReports)}
          icon={Radio}
          tone="high"
          hint={`${stats.highPriorityReports} critical or high`}
        />
        <StatCard
          label="Available shelters"
          value={String(stats.sheltersAvailable)}
          icon={Home}
          tone="safe"
          hint={`${stats.shelterSeatsFree} places free`}
        />
        <StatCard
          label="People affected"
          value={stats.peopleAffected.toLocaleString("en-IN")}
          icon={Users}
          tone="accent"
          hint="Across all reports"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">Emergency map</h2>
              <p className="truncate text-sm text-muted-foreground">
                Disaster zones, shelters, hospitals and blocked roads — simulated data
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/emergency-map">
                Expand <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </header>
          <EmergencyMap
            reports={reports}
            shelters={shelters}
            hospitals={hospitals}
            roads={demoBlockedRoads}
            className="h-[26rem] sm:h-[32rem]"
          />
        </section>

        <div className="space-y-5">
          <Card className="border-critical/40 bg-critical/8 p-4 shadow-panel">
            <h2 className="text-lg font-semibold">Need urgent help?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sends your location and profile to the response team. Demo only.
            </p>
            <div className="mt-3">
              <SosButton size="large" />
            </div>
          </Card>

          <Card className="border-border/70 bg-card p-4 shadow-panel">
            <h2 className="text-lg font-semibold">Nearby help</h2>
            <div className="mt-3 space-y-2">
              <NearestHelpRow
                icon={Home}
                title={nearestShelter.name}
                subtitle={`Nearest shelter · ${nearestShelter.locationName}`}
                distanceKm={nearestShelter.distanceKm}
                availability={`${nearestShelter.capacity - nearestShelter.occupied} free`}
              />
              <NearestHelpRow
                icon={Hospital}
                title={nearestHospital.name}
                subtitle={`Nearest hospital · ${nearestHospital.triageLoad} emergency load`}
                distanceKm={nearestHospital.distanceKm}
                availability={`${nearestHospital.bedsAvailable} beds`}
                tone="accent"
              />
            </div>
            <Button asChild variant="secondary" size="sm" className="mt-3 w-full">
              <Link to="/find-help">
                <Building2 className="h-4 w-4" /> See all shelters &amp; hospitals
              </Link>
            </Button>
          </Card>

          <Card className="border-border/70 bg-card p-4 shadow-panel">
            <h2 className="text-lg font-semibold">Emergency alerts</h2>
            <ul className="mt-3 space-y-2.5">
              {demoAlerts.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-lg border border-border/60 bg-surface-2/50 p-3"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">{alert.title}</p>
                    <SeverityBadge severity={alert.severity} showIcon={false} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
                  <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground/80">
                    {alert.source} · {formatTimeAgo(alert.issuedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <section className="space-y-3">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">Critical reports</h2>
            <p className="truncate text-sm text-muted-foreground">
              Highest-severity citizen reports triaged by AI
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/report">
              <Siren className="h-4 w-4" /> Report disaster
            </Link>
          </Button>
        </header>

        {criticalReports.length === 0 ? (
          <EmptyState
            title="No critical reports right now"
            description="New citizen reports appear here as soon as the AI triage assigns a high or critical severity."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {criticalReports.slice(0, 6).map((report) => (
              <DisasterReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        ResQAI is a hackathon prototype. All incident, shelter and hospital data shown is simulated
        demo data, not real-time official information.
      </p>
    </div>
  );
}
