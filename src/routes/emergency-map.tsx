import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Filter } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EmergencyMap, MapLegend } from "@/components/resq/emergency-map";
import { EmptyState } from "@/components/resq/states";
import {
  demoBlockedRoads,
  demoHospitals,
  demoShelters,
  type DisasterType,
  type Severity,
} from "@/data/demo";
import { useReports } from "@/lib/report-store";

export const Route = createFileRoute("/emergency-map")({
  head: () => ({
    meta: [
      { title: "Emergency Map — ResQAI Disaster Zones & Shelters" },
      {
        name: "description",
        content:
          "Filter simulated disaster zones, shelters, relief camps, hospitals and blocked roads on the ResQAI emergency map.",
      },
      { property: "og:title", content: "Emergency Map — ResQAI Disaster Zones & Shelters" },
      {
        property: "og:description",
        content: "Map-centred view of disaster zones, shelters, hospitals and blocked roads.",
      },
    ],
  }),
  component: EmergencyMapPage,
});

const disasterFilters: { value: DisasterType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "flood", label: "Flood" },
  { value: "landslide", label: "Landslide" },
  { value: "earthquake", label: "Earthquake" },
];

const severityFilters: Severity[] = ["critical", "high", "moderate", "low"];

function EmergencyMapPage() {
  const { reports } = useReports();
  const [disaster, setDisaster] = useState<DisasterType | "all">("all");
  const [severities, setSeverities] = useState<Severity[]>([...severityFilters]);
  const [facilities, setFacilities] = useState({
    shelters: true,
    hospitals: true,
    reliefCamps: true,
    roads: true,
  });

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          (disaster === "all" || report.type === disaster) && severities.includes(report.severity),
      ),
    [reports, disaster, severities],
  );

  const filteredShelters = useMemo(
    () =>
      demoShelters.filter((shelter) =>
        shelter.kind === "relief-camp" ? facilities.reliefCamps : facilities.shelters,
      ),
    [facilities],
  );

  const toggleSeverity = (value: Severity) =>
    setSeverities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );

  return (
    <div className="mx-auto w-full max-w-[110rem] p-3 sm:p-5">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Emergency map</h1>
        <p className="text-sm text-muted-foreground">
          Demo map — simulated incident, shelter and road data. Not real-time official information.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="border-border/70 bg-card p-4 shadow-panel">
            <p className="ops-label inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filters
            </p>

            <div className="mt-3">
              <p className="text-sm font-medium">Disaster</p>
              <div className="mt-2 space-y-1.5">
                {disasterFilters.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      type="radio"
                      name="disaster"
                      className="accent-primary"
                      checked={disaster === option.value}
                      onChange={() => setDisaster(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            <p className="text-sm font-medium">Facilities</p>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["shelters", "Shelters"],
                  ["hospitals", "Hospitals"],
                  ["reliefCamps", "Relief camps"],
                  ["roads", "Blocked roads"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`facility-${key}`}
                    checked={facilities[key]}
                    onCheckedChange={(checked) =>
                      setFacilities((prev) => ({ ...prev, [key]: checked === true }))
                    }
                  />
                  <Label htmlFor={`facility-${key}`} className="text-sm text-muted-foreground">
                    {label}
                  </Label>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <p className="text-sm font-medium">Severity</p>
            <div className="mt-2 space-y-2">
              {severityFilters.map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`severity-${value}`}
                    checked={severities.includes(value)}
                    onCheckedChange={() => toggleSeverity(value)}
                  />
                  <Label htmlFor={`severity-${value}`} className="text-sm capitalize text-muted-foreground">
                    {value}
                  </Label>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <div className="min-w-0 space-y-3">
          <EmergencyMap
            reports={filteredReports}
            shelters={filteredShelters}
            hospitals={facilities.hospitals ? demoHospitals : []}
            roads={facilities.roads ? demoBlockedRoads : []}
            className="h-[32rem] lg:h-[calc(100vh-13rem)]"
          />
          {filteredReports.length === 0 && (
            <EmptyState
              title="No incidents match these filters"
              description="Widen the disaster type or severity selection to see reported zones again."
            />
          )}
        </div>
      </div>
    </div>
  );
}
