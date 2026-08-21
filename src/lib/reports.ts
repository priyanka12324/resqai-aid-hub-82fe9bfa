import type { DisasterReport, DisasterType, Severity } from "@/data/demo";
import { latLngToPoint } from "@/lib/geo";

/** Shape returned by the report server functions (client-safe DTO). */
export interface ReportDto {
  id: string;
  code: string;
  type: DisasterType;
  title: string;
  description: string;
  location_name: string;
  district: string;
  lat: number;
  lng: number;
  severity: Severity;
  status: DisasterReport["status"];
  people_affected: number;
  image_url: string | null;
  ai_summary: string | null;
  ai_recommended_action: string | null;
  ai_hazards: string[];
  ai_actions: string[];
  ai_priority_score: number;
  ai_confidence: number;
  ai_risk_level: string | null;
  ai_affected_area: string | null;
  ai_simulated: boolean;
  created_at: string;
}

/** The stored report categories the citizen form offers beyond the hazard enum. */
export const REPORT_CATEGORY_TO_TYPE: Record<string, DisasterType> = {
  flood: "flood",
  landslide: "landslide",
  earthquake: "earthquake",
  fire: "fire",
  cyclone: "cyclone",
  road: "earthquake",
  building: "earthquake",
  other: "flood",
};

/** Map a database row onto the existing UI report model, unchanged. */
export function dtoToReport(row: ReportDto): DisasterReport {
  return {
    id: row.code || row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    locationName: row.location_name,
    district: row.district,
    severity: row.severity,
    status: row.status,
    reportedAt: row.created_at,
    peopleAffected: row.people_affected,
    aiConfidence: Number(row.ai_confidence) || 0.75,
    aiSummary: row.ai_summary ?? "AI triage pending.",
    recommendedAction: row.ai_recommended_action ?? "Follow official instructions.",
    point: latLngToPoint({ lat: row.lat, lng: row.lng }),
  };
}
