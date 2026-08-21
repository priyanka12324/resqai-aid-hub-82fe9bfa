import type { BlockedRoad, DisasterReport, Hospital, Shelter } from "@/data/demo";

export type MapSelection =
  | { kind: "disaster"; data: DisasterReport }
  | { kind: "shelter"; data: Shelter }
  | { kind: "hospital"; data: Hospital }
  | { kind: "road"; data: BlockedRoad };

/** Clickable legend / layer keys. */
export type LegendKey =
  "critical" | "high" | "moderate" | "low" | "shelters" | "hospitals" | "roads";

export const ALL_LEGEND_KEYS: LegendKey[] = [
  "critical",
  "high",
  "moderate",
  "low",
  "shelters",
  "hospitals",
  "roads",
];

export const LEGEND_ITEMS: { key: LegendKey; color: string; label: string }[] = [
  { key: "critical", color: "bg-critical", label: "Critical disaster zone" },
  { key: "high", color: "bg-high", label: "High-risk zone" },
  { key: "moderate", color: "bg-moderate", label: "Moderate incident" },
  { key: "low", color: "bg-low", label: "Low / resolved" },
  { key: "shelters", color: "bg-safe", label: "Shelter / relief camp" },
  { key: "hospitals", color: "bg-accent", label: "Hospital" },
  { key: "roads", color: "bg-moderate", label: "Blocked road" },
];
