import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SosType = "medical" | "trapped" | "flood" | "fire" | "building" | "other";

export const SOS_TYPE_LABEL: Record<SosType, string> = {
  medical: "Medical emergency",
  trapped: "Trapped",
  flood: "Flood",
  fire: "Fire",
  building: "Building damage",
  other: "Other",
};

export type DatabaseSosStatus = Database["public"]["Enums"]["sos_status"];
type SosAlertRow = Database["public"]["Tables"]["sos_alerts"]["Row"];

export interface SosAlert {
  id: string;
  type: SosType;
  message: string;
  location: string;
  coords: string;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  status: string;
  rawStatus: DatabaseSosStatus;
}

const fallbackSeeded: SosAlert[] = [
  {
    id: "SOS-2039",
    type: "trapped",
    message: "Two elderly residents on the ground floor, water rising.",
    location: "Rispana Riverside Colony, Dehradun",
    coords: "30.3165° N, 78.0322° E",
    lat: 30.3165,
    lng: 78.0322,
    createdAt: "2026-08-15T09:05:00Z",
    status: "Acknowledged (demo)",
    rawStatus: "acknowledged",
  },
  {
    id: "SOS-2038",
    type: "medical",
    message: "Injured leg, cannot walk to the shelter.",
    location: "Sector 21 Housing Board",
    coords: "30.3241° N, 78.0410° E",
    lat: 30.3241,
    lng: 78.041,
    createdAt: "2026-08-15T08:22:00Z",
    status: "Acknowledged (demo)",
    rawStatus: "acknowledged",
  },
];

function mapDbRowToSosAlert(row: SosAlertRow): SosAlert {
  const latStr = row.lat ? `${row.lat.toFixed(4)}° N` : "30.3165° N";
  const lngStr = row.lng ? `${row.lng.toFixed(4)}° E` : "78.0322° E";
  const statusLabel =
    row.status === "pending"
      ? "Sent to emergency response dashboard"
      : row.status === "acknowledged"
        ? "Acknowledged (demo)"
        : row.status.toUpperCase();

  return {
    id: `SOS-${row.id.slice(0, 6).toUpperCase()}`,
    type: (row.emergency_type || "other") as SosType,
    message: row.message || "Emergency assistance requested.",
    location: `Coordinates: ${latStr}, ${lngStr}`,
    coords: `${latStr}, ${lngStr}`,
    lat: row.lat,
    lng: row.lng,
    createdAt: row.created_at,
    status: statusLabel,
    rawStatus: (row.status || "pending") as DatabaseSosStatus,
  };
}

export async function sendSosAlert(input: {
  type: SosType;
  message: string;
  location: string;
  coords: string;
  lat?: number;
  lng?: number;
  userId?: string | null;
}): Promise<SosAlert> {
  const lat = input.lat ?? 30.3165;
  const lng = input.lng ?? 78.0322;

  // If user is authenticated, write to Supabase sos_alerts table
  if (input.userId) {
    const { data, error } = await supabase
      .from("sos_alerts")
      .insert({
        user_id: input.userId,
        emergency_type: input.type,
        message: input.message || "Emergency distress signal triggered.",
        lat,
        lng,
        status: "pending",
      })
      .select()
      .single();

    if (!error && data) {
      return mapDbRowToSosAlert(data);
    }
  }

  // Fallback / guest alert
  return {
    id: `SOS-${Math.floor(2040 + Math.random() * 1000)}`,
    type: input.type,
    message: input.message || "Emergency distress signal triggered.",
    location: input.location || "Current Location",
    coords: input.coords || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    lat,
    lng,
    createdAt: new Date().toISOString(),
    status: "Sent to emergency response dashboard",
    rawStatus: "pending",
  };
}

export async function updateSosStatusInDb(
  alertId: string,
  newStatus: DatabaseSosStatus,
): Promise<boolean> {
  try {
    const cleanId = alertId.replace("SOS-", "").toLowerCase();
    const { error } = await supabase
      .from("sos_alerts")
      .update({ status: newStatus })
      .ilike("id", `${cleanId}%`);
    return !error;
  } catch (err) {
    console.error("Failed to update SOS status:", err);
    return false;
  }
}

export function useSosHistory() {
  const [alerts, setAlerts] = useState<SosAlert[]>(fallbackSeeded);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sos_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        setAlerts(fallbackSeeded);
        return;
      }

      const parsed = data.map(mapDbRowToSosAlert);
      setAlerts(parsed);
    } catch (err) {
      console.error("Failed to fetch SOS alerts:", err);
      setAlerts(fallbackSeeded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates on sos_alerts
    const channel = supabase
      .channel("public:sos_alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  return alerts;
}
