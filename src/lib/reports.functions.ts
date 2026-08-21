import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AnalysisResult } from "@/lib/ai-analysis";
import type { ReportDto } from "@/lib/reports";

const submitSchema = z.object({
  category: z.enum(["flood", "landslide", "earthquake", "fire", "cyclone", "road", "building", "other"]),
  disasterType: z.enum(["flood", "landslide", "earthquake", "fire", "cyclone"]),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  locationName: z.string().trim().min(3).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  peopleAffected: z.number().int().min(0).max(1_000_000),
  immediateDanger: z.enum(["yes", "no", "unknown"]),
  /** Optional photo as a data URL, capped well below the 5 MB client limit. */
  imageDataUrl: z.string().max(7_500_000).nullable().optional(),
  imageName: z.string().max(180).nullable().optional(),
});

const REPORT_COLUMNS =
  "id, code, type, title, description, location_name, district, lat, lng, severity, status, people_affected, image_url, ai_summary, ai_recommended_action, ai_hazards, ai_actions, ai_priority_score, ai_confidence, ai_risk_level, ai_affected_area, ai_simulated, created_at";

/** Public list of incident reports — safe columns only, read as anon. */
export const listReports = createServerFn({ method: "GET" }).handler(async (): Promise<ReportDto[]> => {
  const { createPublicSupabase } = await import("@/lib/supabase-public.server");
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("listReports failed", error.message);
    return [];
  }
  return (data ?? []) as unknown as ReportDto[];
});

/**
 * Store a citizen report, then attach AI triage.
 *
 * The row is written first, so a failing model never loses the report; the
 * analysis is then merged in as a second update.
 */
export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ report: ReportDto; analysis: AnalysisResult }> => {
    const { supabase, userId } = context;

    const { data: inserted, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        type: data.disasterType,
        title: data.title,
        description: data.description,
        location_name: data.locationName,
        district: "Citizen submitted",
        lat: data.lat,
        lng: data.lng,
        people_affected: data.peopleAffected,
        immediate_danger: data.immediateDanger,
        status: "new",
      })
      .select(REPORT_COLUMNS)
      .single();

    if (error || !inserted) {
      throw new Error(error?.message ?? "Could not save the report.");
    }
    let row = inserted as unknown as ReportDto;

    // Optional photo: uploaded server-side into a private bucket, stored as a
    // long-lived signed URL so no public bucket or key is ever exposed.
    if (data.imageDataUrl?.startsWith("data:image/")) {
      try {
        const { uploadReportImage } = await import("@/lib/report-image.server");
        const imageUrl = await uploadReportImage(row.id, data.imageDataUrl);
        if (imageUrl) {
          await supabase.from("reports").update({ image_url: imageUrl }).eq("id", row.id);
          row = { ...row, image_url: imageUrl };
        }
      } catch (imageError) {
        console.error("report image upload failed", imageError);
      }
    }

    const { analyzeReport } = await import("@/lib/ai-triage.server");
    const analysis = await analyzeReport({
      disasterType: data.disasterType,
      description: data.description,
      location: data.locationName,
      peopleAffected: data.peopleAffected,
      immediateDanger: data.immediateDanger,
      image: data.imageName ?? null,
    });

    const severity = analysis.severity.toLowerCase() as ReportDto["severity"];
    const { data: updated } = await supabase
      .from("reports")
      .update({
        severity,
        ai_summary: analysis.summary,
        ai_recommended_action: analysis.recommendedActions[0] ?? null,
        ai_hazards: analysis.detectedHazards,
        ai_actions: analysis.recommendedActions,
        ai_priority_score: analysis.priorityScore,
        ai_confidence: Math.min(0.95, Math.max(0.4, analysis.priorityScore / 100)),
        ai_risk_level: analysis.riskLevel,
        ai_affected_area: analysis.affectedArea,
        ai_simulated: analysis.simulated,
      })
      .eq("id", row.id)
      .select(REPORT_COLUMNS)
      .maybeSingle();

    return { report: (updated as unknown as ReportDto | null) ?? row, analysis };
  });
