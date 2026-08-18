import { useCallback, useEffect, useState } from "react";

/** Prototype SOS log — localStorage only. No emergency service is contacted. */

export type SosType = "medical" | "trapped" | "flood" | "fire" | "building" | "other";

export const SOS_TYPE_LABEL: Record<SosType, string> = {
  medical: "Medical emergency",
  trapped: "Trapped",
  flood: "Flood",
  fire: "Fire",
  building: "Building damage",
  other: "Other",
};

export interface SosAlert {
  id: string;
  type: SosType;
  message: string;
  location: string;
  coords: string;
  createdAt: string;
  status: "Sent to emergency response dashboard" | "Acknowledged (demo)";
}

const STORAGE_KEY = "resqai.sos.v1";
const EVENT = "resqai:sos-changed";

const seeded: SosAlert[] = [
  {
    id: "SOS-2039",
    type: "trapped",
    message: "Two elderly residents on the ground floor, water rising.",
    location: "Rispana Riverside Colony, Dehradun",
    coords: "30.3165° N, 78.0322° E",
    createdAt: "2026-08-15T09:05:00Z",
    status: "Acknowledged (demo)",
  },
  {
    id: "SOS-2038",
    type: "medical",
    message: "Injured leg, cannot walk to the shelter.",
    location: "Sector 21 Housing Board",
    coords: "30.3241° N, 78.0410° E",
    createdAt: "2026-08-15T08:22:00Z",
    status: "Acknowledged (demo)",
  },
];

function readStored(): SosAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SosAlert[]) : [];
  } catch {
    return [];
  }
}

export function createSosAlert(input: {
  type: SosType;
  message: string;
  location: string;
  coords: string;
}): SosAlert {
  const alert: SosAlert = {
    id: `SOS-${2040 + readStored().length}`,
    type: input.type,
    message: input.message || "No additional details provided.",
    location: input.location,
    coords: input.coords,
    createdAt: new Date().toISOString(),
    status: "Sent to emergency response dashboard",
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([alert, ...readStored()].slice(0, 25)));
    window.dispatchEvent(new Event(EVENT));
  }
  return alert;
}

export function useSosHistory() {
  const [stored, setStored] = useState<SosAlert[]>([]);
  const sync = useCallback(() => setStored(readStored()), []);

  useEffect(() => {
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [sync]);

  return [...stored, ...seeded];
}
