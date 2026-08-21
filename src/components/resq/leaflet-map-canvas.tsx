import { useEffect, useRef, useState } from "react";
import L from "leaflet";

import { CITY_CENTER, pointToLatLng, type LatLng } from "@/lib/geo";
import type { BlockedRoad, DisasterReport, Hospital, Severity, Shelter } from "@/data/demo";
import { DISASTER_LABEL } from "@/data/demo";
import type { MapSelection } from "@/components/resq/map-selection";

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#f0393f",
  high: "#f97316",
  moderate: "#eab308",
  low: "#38bdf8",
};

export interface LeafletMapCanvasProps {
  reports: DisasterReport[];
  shelters: Shelter[];
  hospitals: Hospital[];
  roads: BlockedRoad[];
  selection: MapSelection | null;
  onSelect: (selection: MapSelection | null) => void;
  userLocation: LatLng | null;
  routePolyline: string | null;
  focus: { coord: LatLng; key: number } | null;
}

function createReportIcon(severity: Severity) {
  const color = SEVERITY_COLOR[severity] || "#f97316";
  const isCritical = severity === "critical";
  const html = `
    <div style="position: relative; width: 26px; height: 26px; display: grid; place-items: center;">
      ${
        isCritical
          ? `<span style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid ${color}; opacity: 0.75; animation: resq-pulse 1.8s ease-out infinite;"></span>`
          : ""
      }
      <div style="width: 18px; height: 18px; border-radius: 9999px; background-color: ${color}; border: 2px solid #0c1014; box-shadow: 0 0 10px ${color}88;"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "resq-disaster-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

function createShelterIcon(status: Shelter["status"]) {
  const color = status === "closed" ? "#64748b" : status === "full" ? "#f97316" : "#22c55e";
  const html = `
    <div style="width: 22px; height: 22px; border-radius: 6px; background-color: ${color}; border: 2px solid #0c1014; display: grid; place-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "resq-shelter-marker",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function createHospitalIcon(triageLoad: Hospital["triageLoad"]) {
  const color =
    triageLoad === "overloaded" ? "#f0393f" : triageLoad === "busy" ? "#eab308" : "#06b6d4";
  const html = `
    <div style="width: 22px; height: 22px; border-radius: 6px; background-color: ${color}; border: 2px solid #0c1014; display: grid; place-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "resq-hospital-marker",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function createUserIcon() {
  const html = `
    <div style="position: relative; width: 24px; height: 24px; display: grid; place-items: center;">
      <span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: rgba(56, 189, 248, 0.35); animation: resq-pulse 2s ease-out infinite;"></span>
      <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: #38bdf8; border: 2px solid #ffffff; box-shadow: 0 0 8px #38bdf8;"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "resq-user-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function LeafletMapCanvas({
  reports,
  shelters,
  hospitals,
  roads,
  selection,
  onSelect,
  userLocation,
  routePolyline,
  focus,
}: LeafletMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [ready, setReady] = useState(false);

  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [CITY_CENTER.lat, CITY_CENTER.lng],
      zoom: 13,
      zoomControl: true,
    });

    // Dark Matter tile layer for emergency operations theme
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;

    map.on("click", () => {
      selectRef.current(null);
    });

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers & Layers
  useEffect(() => {
    if (!ready || !mapRef.current || !layersGroupRef.current) return;

    const group = layersGroupRef.current;
    group.clearLayers();

    // 1. Disaster Reports
    reports.forEach((report) => {
      const coord = pointToLatLng(report.point);
      const marker = L.marker([coord.lat, coord.lng], {
        icon: createReportIcon(report.severity),
      });

      marker.bindPopup(`
        <div style="font-size: 13px;">
          <div style="font-weight: 600; color: ${SEVERITY_COLOR[report.severity]}; margin-bottom: 2px;">
            ${DISASTER_LABEL[report.type].toUpperCase()} · ${report.severity.toUpperCase()}
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">${report.title}</div>
          <div style="color: #94a3b8; font-size: 11px;">${report.locationName}</div>
          <div style="margin-top: 6px; font-size: 11px; color: #cbd5e1;">${report.aiSummary}</div>
        </div>
      `);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        selectRef.current({ kind: "report", report });
      });

      group.addLayer(marker);
    });

    // 2. Shelters
    shelters.forEach((shelter) => {
      const coord = pointToLatLng(shelter.point);
      const marker = L.marker([coord.lat, coord.lng], {
        icon: createShelterIcon(shelter.status),
      });

      marker.bindPopup(`
        <div style="font-size: 13px;">
          <div style="font-weight: 600; color: #22c55e; margin-bottom: 2px;">
            ${shelter.kind === "relief-camp" ? "RELIEF CAMP" : "SHELTER"} · ${shelter.status.toUpperCase()}
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">${shelter.name}</div>
          <div style="color: #94a3b8; font-size: 11px;">${shelter.locationName}</div>
          <div style="margin-top: 4px; font-size: 11px; color: #cbd5e1;">
            Occupancy: <b>${shelter.occupied} / ${shelter.capacity}</b> (${Math.round((shelter.occupied / shelter.capacity) * 100)}%)
          </div>
        </div>
      `);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        selectRef.current({ kind: "shelter", shelter });
      });

      group.addLayer(marker);
    });

    // 3. Hospitals
    hospitals.forEach((hospital) => {
      const coord = pointToLatLng(hospital.point);
      const marker = L.marker([coord.lat, coord.lng], {
        icon: createHospitalIcon(hospital.triageLoad),
      });

      marker.bindPopup(`
        <div style="font-size: 13px;">
          <div style="font-weight: 600; color: #06b6d4; margin-bottom: 2px;">
            HOSPITAL · ${hospital.triageLoad.toUpperCase()} LOAD
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">${hospital.name}</div>
          <div style="color: #94a3b8; font-size: 11px;">${hospital.locationName}</div>
          <div style="margin-top: 4px; font-size: 11px; color: #cbd5e1;">
            Beds Available: <b>${hospital.bedsAvailable}</b> (ICU: <b>${hospital.icuAvailable}</b>)
          </div>
        </div>
      `);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        selectRef.current({ kind: "hospital", hospital });
      });

      group.addLayer(marker);
    });

    // 4. Blocked Roads
    roads.forEach((road) => {
      const from = pointToLatLng(road.from);
      const to = pointToLatLng(road.to);
      const line = L.polyline(
        [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        {
          color: "#f0393f",
          weight: 4,
          dashArray: "8, 6",
          opacity: 0.9,
        },
      );

      line.bindPopup(`
        <div style="font-size: 13px;">
          <div style="font-weight: 600; color: #f0393f; margin-bottom: 2px;">BLOCKED ROAD · ${road.severity.toUpperCase()}</div>
          <div style="font-weight: 600; margin-bottom: 4px;">${road.name}</div>
          <div style="font-size: 11px; color: #cbd5e1;">${road.reason}</div>
        </div>
      `);

      line.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        selectRef.current({ kind: "road", road });
      });

      group.addLayer(line);
    });
  }, [ready, reports, shelters, hospitals, roads]);

  // User location marker
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: createUserIcon(),
          zIndexOffset: 1000,
        }).addTo(map);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [ready, userLocation]);

  // Pan / Focus handling
  useEffect(() => {
    if (!ready || !mapRef.current || !focus) return;
    mapRef.current.setView([focus.coord.lat, focus.coord.lng], 14, {
      animate: true,
    });
  }, [ready, focus]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl overflow-hidden shadow-inner"
      style={{ minHeight: "400px" }}
    />
  );
}
