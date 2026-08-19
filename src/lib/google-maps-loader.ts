/** Loads the Google Maps JavaScript API once, on the client only. */
let loadPromise: Promise<typeof google.maps> | null = null;

export const GOOGLE_MAPS_BROWSER_KEY = import.meta.env[
  "VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"
] as string | undefined;

const TRACKING_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
  | string
  | undefined;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }
  if (!GOOGLE_MAPS_BROWSER_KEY) {
    return Promise.reject(new Error("Google Maps browser key is not configured."));
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = "__resqaiInitGoogleMaps";
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      resolve(window.google.maps);
    };

    const params = new URLSearchParams({
      key: GOOGLE_MAPS_BROWSER_KEY,
      loading: "async",
      libraries: "geometry",
      callback: callbackName,
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load the Google Maps script."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
