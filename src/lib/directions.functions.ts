import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const coord = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const inputSchema = z.object({
  origin: coord,
  destination: coord,
  mode: z.enum(["DRIVE", "WALK", "TWO_WHEELER"]).default("DRIVE"),
});

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
}

/**
 * Computes a route between two points using the OpenStreetMap OSRM routing service.
 * Free, open-source, and does not require proprietary Google API keys.
 */
export const computeRoute = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<RouteResult> => {
    const { origin, destination } = data;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=simplified`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "ResQAI-Disaster-Response-App/1.0",
        },
      });

      if (response.ok) {
        const json = await response.json();
        const route = json.routes?.[0];
        if (route) {
          return {
            distanceMeters: Math.round(route.distance),
            durationSeconds: Math.round(route.duration),
            encodedPolyline: route.geometry,
          };
        }
      }
    } catch (err) {
      console.warn("OSRM routing service failed, computing direct distance:", err);
    }

    // Fallback direct distance calculation
    const R = 6371e3; // metres
    const φ1 = (origin.lat * Math.PI) / 180;
    const φ2 = (destination.lat * Math.PI) / 180;
    const Δφ = ((destination.lat - origin.lat) * Math.PI) / 180;
    const Δλ = ((destination.lng - origin.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);
    const durationSeconds = Math.round((distanceMeters / 1000 / 35) * 3600); // approx 35 km/h driving speed

    return {
      distanceMeters,
      durationSeconds,
      encodedPolyline: "",
    };
  });
