import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { demoShelters, demoHospitals, type Shelter, type Hospital } from "@/data/demo";
import { latLngToPoint, CITY_CENTER } from "@/lib/geo";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function useFacilities() {
  const [shelters, setShelters] = useState<Shelter[]>(demoShelters);
  const [hospitals, setHospitals] = useState<Hospital[]>(demoHospitals);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .order("name", { ascending: true });

      if (error || !data || data.length === 0) {
        setShelters(demoShelters);
        setHospitals(demoHospitals);
        return;
      }

      const shelterList: Shelter[] = [];
      const hospitalList: Hospital[] = [];

      for (const row of data) {
        const pt = latLngToPoint({ lat: row.lat, lng: row.lng });
        const dist = calculateDistance(CITY_CENTER.lat, CITY_CENTER.lng, row.lat, row.lng);

        if (row.kind === "hospital") {
          hospitalList.push({
            id: row.code || row.id,
            name: row.name,
            locationName: row.location_name,
            bedsAvailable: row.beds_available,
            icuAvailable: row.icu_available,
            distanceKm: dist || 2.0,
            triageLoad: (row.triage_load as Hospital["triageLoad"]) || "normal",
            specialties: row.amenities || [],
            contact: row.contact || "+91 90000 00000",
            point: pt,
          });
        } else {
          shelterList.push({
            id: row.code || row.id,
            name: row.name,
            locationName: row.location_name,
            capacity: row.capacity,
            occupied: row.occupied,
            distanceKm: dist || 1.5,
            kind: row.kind as Shelter["kind"],
            status: (row.status as Shelter["status"]) || "open",
            facilities: row.amenities || [],
            contact: row.contact || "+91 90000 00000",
            point: pt,
          });
        }
      }

      if (shelterList.length > 0) setShelters(shelterList);
      if (hospitalList.length > 0) setHospitals(hospitalList);
    } catch (err) {
      console.error("Failed to load facilities from Supabase:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();

    // Subscribe to realtime updates on facilities
    const channel = supabase
      .channel("public:facilities")
      .on("postgres_changes", { event: "*", schema: "public", table: "facilities" }, () => {
        fetchFacilities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFacilities]);

  return { shelters, hospitals, loading, refresh: fetchFacilities };
}
