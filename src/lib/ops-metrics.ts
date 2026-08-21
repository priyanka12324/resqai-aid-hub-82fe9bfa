import { demoHospitals, demoShelters, type DisasterReport, type Severity } from "@/data/demo";

/**
 * Single source of truth for the numbers shown on the dashboard and the
 * command center, so both screens always agree on the same demo dataset.
 */

const severityWeight: Record<Severity, number> = { critical: 92, high: 74, moderate: 52, low: 28 };

export function priorityScore(report: DisasterReport) {
  return Math.min(
    100,
    Math.round(
      severityWeight[report.severity] +
        report.aiConfidence * 5 +
        Math.min(6, report.peopleAffected / 40),
    ),
  );
}

export const openShelters = demoShelters.filter((shelter) => shelter.status !== "closed");

export const shelterSeatsFree = openShelters.reduce(
  (total, shelter) => total + Math.max(0, shelter.capacity - shelter.occupied),
  0,
);

export const shelterCapacityUsed =
  openShelters.reduce((total, shelter) => total + shelter.occupied, 0) /
  Math.max(
    1,
    openShelters.reduce((total, shelter) => total + shelter.capacity, 0),
  );

export const hospitalBedsFree = demoHospitals.reduce(
  (total, hospital) => total + hospital.bedsAvailable,
  0,
);

export function computeOpsStats(reports: DisasterReport[], resolvedIds: string[] = []) {
  const active = reports.filter(
    (report) => report.status !== "resolved" && !resolvedIds.includes(report.id),
  );
  return {
    activeDisasters: active.length,
    criticalReports: reports.filter((report) => report.severity === "critical").length,
    highPriorityReports: reports.filter(
      (report) => report.severity === "critical" || report.severity === "high",
    ).length,
    peopleAffected: reports.reduce((total, report) => total + report.peopleAffected, 0),
    sheltersAvailable: openShelters.length,
    shelterSeatsFree,
    hospitalBedsFree,
    shelterCapacityUsed,
  };
}
