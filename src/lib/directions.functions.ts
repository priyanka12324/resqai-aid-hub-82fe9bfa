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
 * Computes a single route between two points via the Google Routes API
 * (through the Lovable connector gateway). Called only on an explicit
 * "Get directions" click — never polled or fanned out.
 */
export const computeRoute = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<RouteResult> => {
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableApiKey || !connectionKey) {
      throw new Error("Google Maps connector is not configured.");
    }

    const response = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": connectionKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: data.origin.lat, longitude: data.origin.lng } } },
          destination: {
            location: { latLng: { latitude: data.destination.lat, longitude: data.destination.lng } },
          },
          travelMode: data.mode,
          ...(data.mode === "DRIVE" ? { routingPreference: "TRAFFIC_AWARE" } : {}),
        }),
      },
    );

    if (response.status === 403) {
      const details: Array<{ reason?: string }> =
        (await response.json().catch(() => null))?.error?.details ?? [];
      const reason = details.find((d) => d.reason)?.reason;
      if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
        throw new Error(
          'Google Maps server key is referrer-restricted. In Google Cloud Console, set the server key\'s application restrictions to "None" or "IP addresses".',
        );
      }
      if (reason === "API_KEY_SERVICE_BLOCKED") {
        throw new Error(
          "Google Maps server key does not allow the Routes API. Add it to the server key's allowed-APIs list in Google Cloud Console.",
        );
      }
      throw new Error("Google Maps request was denied (403). Check the server key restrictions.");
    }

    if (!response.ok) {
      const body = await response.text();
      console.error(`Routes API failed [${response.status}]: ${body}`);
      throw new Error(`Routing failed [${response.status}]: ${body}`);
    }

    const json = (await response.json()) as {
      routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: { encodedPolyline?: string };
      }>;
    };

    const route = json.routes?.[0];
    if (!route?.polyline?.encodedPolyline) {
      throw new Error("No route found between these points.");
    }

    return {
      distanceMeters: route.distanceMeters ?? 0,
      durationSeconds: Number.parseInt(route.duration ?? "0", 10) || 0,
      encodedPolyline: route.polyline.encodedPolyline,
    };
  });
