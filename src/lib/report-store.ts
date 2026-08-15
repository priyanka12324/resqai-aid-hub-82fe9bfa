import { useCallback, useEffect, useState } from "react";

import { demoReports, type DisasterReport, type DisasterType, type Severity } from "@/data/demo";

/**
 * Local prototype store: citizen-submitted reports live in localStorage so the
 * demo flow (report -> AI analysis -> dashboard/map) works without a backend.
 * Swap this module for API calls when a real backend is wired in.
 */

const STORAGE_KEY = "resqai.reports.v1";
const EVENT = "resqai:reports-changed";

function readStored(): DisasterReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DisasterReport[]) : [];
  } catch {
    return [];
  }
}

export function addReport(report: DisasterReport) {
  if (typeof window === "undefined") return;
  const next = [report, ...readStored()].slice(0, 50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function clearReports() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

/** Demo reports plus anything submitted in this browser session. */
export function useReports() {
  const [submitted, setSubmitted] = useState<DisasterReport[]>([]);

  const sync = useCallback(() => setSubmitted(readStored()), []);

  useEffect(() => {
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return { reports: [...submitted, ...demoReports], submitted, refresh: sync };
}

export interface AiAnalysis {
  disasterType: DisasterType;
  severity: Severity;
  risk: "High" | "Elevated" | "Moderate" | "Low";
  affectedArea: string;
  summary: string;
  recommendedAction: string;
  confidence: number;
}

const summaries: Record<DisasterType, string> = {
  flood:
    "Severe flooding has been reported in the affected area. Road access may be restricted and water levels can rise quickly.",
  landslide:
    "Slope failure reported with unstable debris. Secondary slides are possible while rainfall continues.",
  earthquake:
    "Structural damage reported after ground shaking. Damaged buildings may be unsafe to re-enter.",
  fire: "Active fire with smoke spread reported. Air quality downwind is likely to deteriorate.",
  cyclone: "High winds have damaged light structures. Flying debris remains a hazard.",
};

const actions: Record<DisasterType, string> = {
  flood:
    "Avoid flooded roads and move toward an available elevated shelter. Do not attempt to cross moving water.",
  landslide: "Move away from the slope face and use the marked bypass route to reach a relief camp.",
  earthquake:
    "Stay out of damaged buildings and assemble at the nearest open-ground shelter for a safety check.",
  fire: "Move upwind, close windows, cover your face with a damp cloth and keep access lanes clear.",
  cyclone: "Shelter in a reinforced building away from windows until winds subside.",
};

/**
 * Simulated AI triage. Replace with a real model call (via a server function)
 * when an AI provider is configured — the return shape stays the same.
 */
export function analyzeReport(input: {
  type: DisasterType;
  description: string;
  peopleAffected: number;
  immediateDanger: "yes" | "no" | "unknown";
  locationName: string;
}): AiAnalysis {
  const text = input.description.toLowerCase();
  let score = 1;
  if (input.immediateDanger === "yes") score += 2;
  if (input.immediateDanger === "unknown") score += 1;
  if (input.peopleAffected >= 100) score += 2;
  else if (input.peopleAffected >= 25) score += 1;
  if (/trapped|stranded|collapse|drown|swept|injur|dead|rescue/.test(text)) score += 2;
  if (/rising|fast|heavy|severe/.test(text)) score += 1;
  if (input.type === "flood" || input.type === "earthquake") score += 1;

  const severity: Severity = score >= 6 ? "critical" : score >= 4 ? "high" : score >= 2 ? "moderate" : "low";
  const risk: AiAnalysis["risk"] =
    severity === "critical" ? "High" : severity === "high" ? "Elevated" : severity === "moderate" ? "Moderate" : "Low";

  return {
    disasterType: input.type,
    severity,
    risk,
    affectedArea:
      severity === "critical"
        ? `~2.5 km radius around ${input.locationName}`
        : severity === "high"
          ? `~1.2 km radius around ${input.locationName}`
          : `Localised near ${input.locationName}`,
    summary: summaries[input.type],
    recommendedAction: actions[input.type],
    confidence: Math.min(0.96, 0.62 + score * 0.05),
  };
}
