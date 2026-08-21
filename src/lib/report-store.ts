import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  demoReports,
  type DisasterReport,
  type DisasterType,
  type ReportStatus,
  type Severity,
} from "@/data/demo";
import { latLngToPoint, CITY_CENTER } from "@/lib/geo";
import { mockAnalyzeReport, type AnalysisInput, type AnalysisResult } from "@/lib/ai-analysis";
import type { Database } from "@/integrations/supabase/types";

type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

export interface CreateReportInput {
  type: DisasterType;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  peopleAffected: number;
  immediateDanger: "yes" | "no" | "unknown";
  imageUrl?: string | null;
  userId?: string | null;
}

function mapRowToReport(row: ReportRow): DisasterReport {
  return {
    id: row.code || row.id,
    type: row.type as DisasterType,
    title: row.title,
    description: row.description,
    locationName: row.location_name,
    district: row.district || "Unassigned",
    severity: (row.severity || "moderate") as Severity,
    status: (row.status || "new") as ReportStatus,
    reportedAt: row.created_at,
    peopleAffected: row.people_affected || 0,
    aiConfidence: Number(row.ai_confidence) || 0.8,
    aiSummary: row.ai_summary || "AI automated triage completed.",
    recommendedAction: row.ai_recommended_action || "Follow official emergency instructions.",
    point: latLngToPoint({ lat: row.lat || CITY_CENTER.lat, lng: row.lng || CITY_CENTER.lng }),
  };
}

export async function submitDisasterReport(
  input: CreateReportInput,
): Promise<{ report: DisasterReport; analysis: AnalysisResult }> {
  // 1. Run AI analysis client-side (safe deterministic fallback or server endpoint)
  const analysisInput: AnalysisInput = {
    disasterType: input.type,
    description: input.description,
    location: input.locationName,
    peopleAffected: input.peopleAffected,
    immediateDanger: input.immediateDanger,
    image: input.imageUrl ?? null,
  };
  const analysis = mockAnalyzeReport(analysisInput);
  const severity = analysis.severity.toLowerCase() as Severity;

  // 2. Prepare database payload
  const payload: ReportInsert = {
    type: input.type,
    title: input.title,
    description: input.description,
    location_name: input.locationName,
    district: "Citizen Submitted",
    lat: input.lat,
    lng: input.lng,
    people_affected: input.peopleAffected,
    immediate_danger: input.immediateDanger,
    image_url: input.imageUrl || null,
    severity: severity as Database["public"]["Enums"]["severity_level"],
    status: "new",
    ai_summary: analysis.summary,
    ai_recommended_action: analysis.recommendedActions[0] || null,
    ai_hazards: analysis.detectedHazards,
    ai_actions: analysis.recommendedActions,
    ai_priority_score: analysis.priorityScore,
    ai_confidence: Math.min(0.95, Math.max(0.4, analysis.priorityScore / 100)),
    ai_risk_level: analysis.riskLevel,
    ai_affected_area: analysis.affectedArea,
    ai_simulated: analysis.simulated,
  };

  if (input.userId) {
    payload.user_id = input.userId;
  }

  // 3. Insert into Supabase
  const { data, error } = await supabase.from("reports").insert(payload).select().single();

  if (error || !data) {
    console.error("Supabase insert error for report:", error);
    // If Supabase insert failed (e.g. anonymous user without auth session), create fallback report
    const fallbackReport: DisasterReport = {
      id: `RPT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: input.type,
      title: input.title,
      description: input.description,
      locationName: input.locationName,
      district: "Local Area",
      severity: severity,
      status: "new",
      reportedAt: new Date().toISOString(),
      peopleAffected: input.peopleAffected,
      aiConfidence: 0.85,
      aiSummary: analysis.summary,
      recommendedAction: analysis.recommendedActions[0] || "Move to higher ground immediately.",
      point: latLngToPoint({ lat: input.lat, lng: input.lng }),
    };
    return { report: fallbackReport, analysis };
  }

  const createdReport = mapRowToReport(data);
  return { report: createdReport, analysis };
}

export async function updateReportStatusInDb(
  reportId: string,
  newStatus: ReportStatus,
): Promise<boolean> {
  try {
    // Try updating by code first, then by id if uuid
    if (reportId.startsWith("RPT-")) {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus as Database["public"]["Enums"]["report_status"] })
        .eq("code", reportId);
      if (!error) return true;
    }
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus as Database["public"]["Enums"]["report_status"] })
      .eq("id", reportId);
    return !error;
  } catch (err) {
    console.error("Failed to update report status:", err);
    return false;
  }
}

export function useReports() {
  const [reports, setReports] = useState<DisasterReport[]>(demoReports);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        setReports(demoReports);
        return;
      }

      const parsed = data.map(mapRowToReport);
      setReports(parsed);
    } catch (err) {
      console.error("Error loading reports from Supabase:", err);
      setReports(demoReports);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();

    // Subscribe to realtime updates on reports
    const channel = supabase
      .channel("public:reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  return { reports, loading, refresh: fetchReports };
}
