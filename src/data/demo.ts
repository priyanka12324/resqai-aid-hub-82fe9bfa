/**
 * DEMO / SIMULATED DATA — ResQAI hackathon prototype.
 * None of this is live government or emergency-services data.
 */

export type Severity = "critical" | "high" | "moderate" | "low";

export type DisasterType = "flood" | "earthquake" | "landslide" | "fire" | "cyclone";

export type ReportStatus = "new" | "verified" | "dispatched" | "resolved";

/** Normalised map coordinates (0-100) for the schematic demo map. */
export interface MapPoint {
  x: number;
  y: number;
}

export interface DisasterReport {
  id: string;
  type: DisasterType;
  title: string;
  description: string;
  locationName: string;
  district: string;
  severity: Severity;
  status: ReportStatus;
  reportedAt: string;
  peopleAffected: number;
  aiConfidence: number;
  aiSummary: string;
  recommendedAction: string;
  point: MapPoint;
}

export interface Shelter {
  id: string;
  name: string;
  locationName: string;
  capacity: number;
  occupied: number;
  distanceKm: number;
  kind: "shelter" | "relief-camp";
  status: "open" | "filling" | "full" | "closed";
  facilities: string[];
  contact: string;
  point: MapPoint;
}

export interface Hospital {
  id: string;
  name: string;
  locationName: string;
  bedsAvailable: number;
  icuAvailable: number;
  distanceKm: number;
  triageLoad: "normal" | "busy" | "overloaded";
  specialties: string[];
  contact: string;
  point: MapPoint;
}

export interface BlockedRoad {
  id: string;
  name: string;
  reason: string;
  severity: Severity;
  updatedAt: string;
  from: MapPoint;
  to: MapPoint;
}

export interface EmergencyAlert {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  area: string;
  issuedAt: string;
  source: string;
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export const DISASTER_LABEL: Record<DisasterType, string> = {
  flood: "Flood",
  earthquake: "Earthquake",
  landslide: "Landslide",
  fire: "Fire",
  cyclone: "Cyclone",
};

export const demoReports: DisasterReport[] = [
  {
    id: "RPT-1042",
    type: "flood",
    title: "Riverbank breach flooding residential lanes",
    description:
      "Water rose above knee level in under an hour. Around 40 families are stranded on upper floors near the old bridge.",
    locationName: "Rispana Riverside Colony, Dehradun",
    district: "Dehradun East",
    severity: "critical",
    status: "new",
    reportedAt: "2026-08-15T09:12:00Z",
    peopleAffected: 180,
    aiConfidence: 0.94,
    aiSummary:
      "Multiple corroborating reports plus rising gauge readings indicate an active levee breach with fast-moving water.",
    recommendedAction:
      "Move to the second floor or higher, avoid all road travel, and wait for boat evacuation from the north lane.",
    point: { x: 32, y: 38 },
  },

  {
    id: "RPT-4818",
    type: "landslide",
    title: "Hillside slip blocking access road",
    description:
      "Slope collapsed after continuous rain. Two vehicles trapped, no injuries reported yet.",
    locationName: "Ghat Road KM-14",
    district: "North Hills",
    severity: "high",
    status: "verified",
    reportedAt: "2026-08-15T08:40:00Z",
    peopleAffected: 24,
    aiConfidence: 0.88,
    aiSummary:
      "Image analysis shows unstable debris above the roadway; secondary slides are likely within 12 hours.",
    recommendedAction:
      "Keep 200m clear of the slope face and route traffic via the Sector 7 bypass.",
    point: { x: 63, y: 20 },
  },
  {
    id: "RPT-4812",
    type: "earthquake",
    title: "Structural cracks after 5.1 tremor",
    description:
      "Visible cracks along load-bearing walls in a four-storey apartment block. Residents evacuated to the street.",
    locationName: "Sector 21 Housing Board",
    district: "Central",
    severity: "high",
    status: "verified",
    reportedAt: "2026-08-15T07:05:00Z",
    peopleAffected: 96,
    aiConfidence: 0.81,
    aiSummary:
      "Damage pattern consistent with moderate shaking; building requires structural assessment before re-entry.",
    recommendedAction:
      "Do not re-enter the building. Assemble at the school ground shelter for structural clearance.",
    point: { x: 48, y: 57 },
  },
  {
    id: "RPT-4806",
    type: "flood",
    title: "Storm drain overflow in market street",
    description: "Ankle-deep water across the market, shops closing early.",
    locationName: "Gandhi Market",
    district: "South Zone",
    severity: "moderate",
    status: "new",
    reportedAt: "2026-08-15T06:30:00Z",
    peopleAffected: 60,
    aiConfidence: 0.72,
    aiSummary: "Localised urban flooding from drain blockage; no life-threat signals detected.",
    recommendedAction: "Avoid the underpass, use elevated footpaths, report electrical hazards.",
    point: { x: 40, y: 74 },
  },
  {
    id: "RPT-4799",
    type: "fire",
    title: "Warehouse fire with heavy smoke",
    description: "Smoke drifting into nearby residential blocks; two units on scene.",
    locationName: "Industrial Estate Gate 3",
    district: "West Zone",
    severity: "moderate",
    status: "dispatched",
    reportedAt: "2026-08-15T05:55:00Z",
    peopleAffected: 35,
    aiConfidence: 0.77,
    aiSummary: "Contained perimeter reported; air-quality risk downwind for approximately 1km.",
    recommendedAction: "Close windows, use a damp cloth mask, keep the east lane clear for engines.",
    point: { x: 18, y: 62 },
  },
  {
    id: "RPT-4790",
    type: "cyclone",
    title: "Coastal wind damage to temporary shelters",
    description: "Roof sheets torn off along the fishing settlement.",
    locationName: "Marine Line Settlement",
    district: "Coastal",
    severity: "low",
    status: "resolved",
    reportedAt: "2026-08-14T21:10:00Z",
    peopleAffected: 18,
    aiConfidence: 0.69,
    aiSummary: "Damage assessed as non-structural; relief material already dispatched.",
    recommendedAction: "Collect tarpaulin kits from the ward office relief desk.",
    point: { x: 76, y: 78 },
  },
];

export const demoShelters: Shelter[] = [
  {
    id: "SHL-01",
    name: "Sector 21 Municipal School Shelter",
    kind: "shelter",
    locationName: "Central Dehradun, near water tank",
    capacity: 500,
    occupied: 120,
    distanceKm: 1.2,
    status: "open",
    facilities: ["Medical desk", "Dry rations", "Women & child zone", "Power backup"],
    contact: "+91 90000 11021",
    point: { x: 45, y: 52 },
  },
  {
    id: "SHL-02",
    name: "Riverside Community Hall",
    kind: "shelter",
    locationName: "Dehradun East, Ward 4",
    capacity: 300,
    occupied: 240,
    distanceKm: 2.6,
    status: "filling",
    facilities: ["Drinking water", "Blankets", "Pet-friendly"],
    contact: "+91 90000 11022",
    point: { x: 36, y: 44 },
  },
  {
    id: "SHL-03",
    name: "North Hills Relief Camp",
    kind: "relief-camp",
    locationName: "North Hills, Bypass Junction",
    capacity: 200,
    occupied: 200,
    distanceKm: 5.4,
    status: "full",
    facilities: ["Tented housing", "Kitchen"],
    contact: "+91 90000 11023",
    point: { x: 68, y: 28 },
  },
  {
    id: "SHL-04",
    name: "South Zone Stadium Shelter",
    kind: "shelter",
    locationName: "South Zone, Gate 2",
    capacity: 900,
    occupied: 240,
    distanceKm: 3.8,
    status: "open",
    facilities: ["Medical desk", "Sanitation block", "Accessible ramps", "Charging points"],
    contact: "+91 90000 11024",
    point: { x: 44, y: 80 },
  },
  {
    id: "SHL-05",
    name: "Old Bridge Transit Camp",
    kind: "relief-camp",
    locationName: "East Zone, riverside approach",
    capacity: 150,
    occupied: 0,
    distanceKm: 2.1,
    status: "closed",
    facilities: ["Closed — inside flood zone"],
    contact: "+91 90000 11025",
    point: { x: 33, y: 47 },
  },
];

export const demoHospitals: Hospital[] = [
  {
    id: "HSP-01",
    name: "City General Hospital",
    locationName: "Central, Ring Road",
    bedsAvailable: 42,
    icuAvailable: 6,
    distanceKm: 2.1,
    triageLoad: "busy",
    specialties: ["Trauma", "Orthopaedics", "Paediatrics"],
    contact: "+91 90000 22001",
    point: { x: 52, y: 48 },
  },
  {
    id: "HSP-02",
    name: "Riverside Trauma Centre",
    locationName: "East Zone, Bridge Approach",
    bedsAvailable: 8,
    icuAvailable: 1,
    distanceKm: 1.4,
    triageLoad: "overloaded",
    specialties: ["Trauma", "Emergency surgery"],
    contact: "+91 90000 22002",
    point: { x: 30, y: 46 },
  },
  {
    id: "HSP-03",
    name: "Hillside Mission Hospital",
    locationName: "North Hills, KM-9",
    bedsAvailable: 27,
    icuAvailable: 4,
    distanceKm: 6.7,
    triageLoad: "normal",
    specialties: ["General medicine", "Fracture care"],
    contact: "+91 90000 22003",
    point: { x: 70, y: 16 },
  },
];

export const demoBlockedRoads: BlockedRoad[] = [
  {
    id: "RD-01",
    name: "Old Bridge Approach",
    reason: "Submerged under 1.2m water",
    severity: "critical",
    updatedAt: "2026-08-15T09:20:00Z",
    from: { x: 28, y: 42 },
    to: { x: 40, y: 34 },
  },
  {
    id: "RD-02",
    name: "Ghat Road KM-14",
    reason: "Landslide debris across both lanes",
    severity: "high",
    updatedAt: "2026-08-15T08:45:00Z",
    from: { x: 58, y: 24 },
    to: { x: 70, y: 18 },
  },
  {
    id: "RD-03",
    name: "Market Underpass",
    reason: "Waterlogged, pumping in progress",
    severity: "moderate",
    updatedAt: "2026-08-15T07:30:00Z",
    from: { x: 38, y: 70 },
    to: { x: 48, y: 76 },
  },
];

export const demoAlerts: EmergencyAlert[] = [
  {
    id: "ALT-91",
    severity: "critical",
    title: "Level 3 flood warning — East Zone",
    message:
      "Levee breach confirmed near the old bridge. Immediate vertical evacuation advised for Riverside Colony wards 3-5.",
    area: "East Zone",
    issuedAt: "2026-08-15T09:15:00Z",
    source: "Simulated district control room",
  },
  {
    id: "ALT-90",
    severity: "high",
    title: "Landslide risk overnight — North Hills",
    message: "Saturated slopes above Ghat Road. Avoid hill travel until further notice.",
    area: "North Hills",
    issuedAt: "2026-08-15T08:50:00Z",
    source: "Simulated geological advisory",
  },
  {
    id: "ALT-88",
    severity: "moderate",
    title: "Heavy rain spell continues",
    message: "60-80mm expected in the next 12 hours across Central and South zones.",
    area: "City-wide",
    issuedAt: "2026-08-15T06:00:00Z",
    source: "Simulated weather feed",
  },
];

export const demoStats = {
  activeDisasters: 7,
  criticalReports: 12,
  sheltersAvailable: 8,
  peopleAssisted: 1248,
  responseTeams: 23,
  sosActive: 3,
  shelterCapacityUsed: 0.58,
};


export const demoIncidentTrend = [
  { hour: "00:00", reports: 4, sos: 0 },
  { hour: "03:00", reports: 7, sos: 1 },
  { hour: "06:00", reports: 12, sos: 1 },
  { hour: "09:00", reports: 21, sos: 3 },
  { hour: "12:00", reports: 17, sos: 2 },
  { hour: "15:00", reports: 13, sos: 1 },
];

export function formatTimeAgo(iso: string, now: Date = new Date("2026-08-15T09:40:00Z")): string {
  const diffMinutes = Math.max(1, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
