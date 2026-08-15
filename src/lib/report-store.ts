import { useCallback, useEffect, useState } from "react";

import { demoReports, type DisasterReport } from "@/data/demo";

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
