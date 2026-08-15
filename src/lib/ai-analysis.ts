import type { DisasterType, Severity } from "@/data/demo";

/**
 * Modular AI disaster-analysis contract.
 *
 * The prototype ships a deterministic heuristic ("mock") analyser so the demo
 * always works. When an AI provider is configured through environment
 * variables (see src/lib/ai-analysis.functions.ts) the same shape is returned
 * by the model, so no UI code changes are needed.
 */

export type SeverityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export interface AnalysisInput {
  disasterType: DisasterType;
  description: string;
  location: string;
  peopleAffected: number;
  immediateDanger: "yes" | "no" | "unknown";
  /** Data URL or file name of an attached photo (metadata only in demo mode). */
  image?: string | null;
}

export interface AnalysisResult {
  disasterType: string;
  severity: SeverityLevel;
  riskLevel: string;
  summary: string;
  detectedHazards: string[];
  recommendedActions: string[];
  priorityScore: number;
  affectedArea: string;
  /** true when produced by the offline heuristic instead of a model. */
  simulated: boolean;
  insufficientInformation: boolean;
}

export const SEVERITY_RULES: Record<SeverityLevel, string> = {
  CRITICAL: "Immediate threat to life or severe infrastructure damage.",
  HIGH: "Significant danger requiring urgent assistance.",
  MODERATE: "Damage or risk exists but immediate life threat is unclear.",
  LOW: "Minor incident or informational report.",
};

export const AI_DISCLAIMER =
  "AI-assisted analysis — verify with authorized emergency authorities.";

export function severityToToken(severity: SeverityLevel): Severity {
  return severity.toLowerCase() as Severity;
}

const hazardLibrary: Record<DisasterType, string[]> = {
  flood: ["Fast-moving water", "Submerged roads", "Electrical hazard in water", "Contaminated water"],
  landslide: ["Unstable debris", "Blocked access road", "Further slope failure"],
  earthquake: ["Structural cracks", "Falling debris", "Aftershock risk", "Gas leak risk"],
  fire: ["Dense smoke", "Air-quality risk", "Fire spread to adjacent structures"],
  cyclone: ["High winds", "Flying debris", "Damaged temporary roofing"],
};

const summaries: Record<DisasterType, string> = {
  flood:
    "Flooding has been reported in the affected area based on the submitted report. Road access may be restricted and water levels can rise quickly.",
  landslide:
    "A slope failure has been reported with unstable debris near the access route. Secondary slides remain possible while rainfall continues.",
  earthquake:
    "Structural damage has been reported following ground shaking. Damaged buildings may be unsafe to re-enter until inspected.",
  fire: "An active fire with smoke spread has been reported. Conditions downwind may deteriorate.",
  cyclone: "Wind damage to light structures has been reported in the affected area.",
};

const actions: Record<DisasterType, string[]> = {
  flood: [
    "Move to higher ground or an upper floor immediately.",
    "Avoid flooded roads and never cross moving water.",
    "Head toward the nearest available elevated shelter.",
  ],
  landslide: [
    "Move away from the slope face and keep a safe distance.",
    "Use the marked bypass route to reach a relief camp.",
    "Report any new cracks or ground movement.",
  ],
  earthquake: [
    "Do not re-enter damaged buildings.",
    "Assemble at the nearest open-ground shelter.",
    "Shut off gas supply if a leak is suspected.",
  ],
  fire: [
    "Move upwind and away from the smoke plume.",
    "Cover your face with a damp cloth.",
    "Keep access lanes clear for fire crews.",
  ],
  cyclone: [
    "Shelter in a reinforced building away from windows.",
    "Secure or move away from loose sheeting and debris.",
  ],
};

/**
 * Offline fallback analyser — deterministic, explainable, and clearly labelled
 * as simulated. Never invents real-world emergency information.
 */
export function mockAnalyzeReport(input: AnalysisInput): AnalysisResult {
  const text = input.description.toLowerCase();
  const insufficient = input.description.trim().length < 15;

  let score = 1;
  if (input.immediateDanger === "yes") score += 3;
  if (input.immediateDanger === "unknown") score += 1;
  if (input.peopleAffected >= 100) score += 2;
  else if (input.peopleAffected >= 25) score += 1;
  if (/trapped|stranded|collapse|drown|swept|injur|casualt|rescue/.test(text)) score += 2;
  if (/rising|rapid|fast|heavy|severe/.test(text)) score += 1;
  if (input.disasterType === "flood" || input.disasterType === "earthquake") score += 1;

  const severity: SeverityLevel =
    score >= 7 ? "CRITICAL" : score >= 5 ? "HIGH" : score >= 3 ? "MODERATE" : "LOW";

  const riskLevel =
    severity === "CRITICAL"
      ? "High — life safety risk"
      : severity === "HIGH"
        ? "Elevated — urgent assistance needed"
        : severity === "MODERATE"
          ? "Moderate — monitor closely"
          : "Low — informational";

  const hazards = hazardLibrary[input.disasterType].slice(0, severity === "LOW" ? 1 : 3);
  if (input.immediateDanger === "unknown") hazards.push("Unverified on-ground conditions");

  const summary = insufficient
    ? `Insufficient information in the submitted description to assess this ${input.disasterType} report reliably. Severity is provisional — additional details or a photo are needed.`
    : summaries[input.disasterType];

  return {
    disasterType: input.disasterType,
    severity,
    riskLevel,
    summary,
    detectedHazards: hazards,
    recommendedActions: actions[input.disasterType],
    priorityScore: Math.min(100, Math.round((score / 9) * 100)),
    affectedArea:
      severity === "CRITICAL"
        ? `Approx. 2.5 km radius around ${input.location}`
        : severity === "HIGH"
          ? `Approx. 1.2 km radius around ${input.location}`
          : `Localised near ${input.location}`,
    simulated: true,
    insufficientInformation: insufficient,
  };
}
