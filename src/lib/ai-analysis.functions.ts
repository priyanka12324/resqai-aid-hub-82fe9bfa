import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { mockAnalyzeReport, type AnalysisInput, type AnalysisResult } from "@/lib/ai-analysis";

const inputSchema = z.object({
  disasterType: z.enum(["flood", "landslide", "earthquake", "fire", "cyclone"]),
  description: z.string().trim().max(2000),
  location: z.string().trim().max(200),
  peopleAffected: z.number().int().min(0).max(1_000_000),
  immediateDanger: z.enum(["yes", "no", "unknown"]),
  image: z.string().max(64).nullable().optional(),
});

/**
 * Disaster triage endpoint.
 *
 * A model provider can be attached later by reading its key from an
 * environment variable inside this handler (never hard-coded, never shipped to
 * the browser). Until then the deterministic offline analyser answers, so the
 * prototype always works.
 */
export const analyzeDisasterReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env["AI_ANALYSIS_API_KEY"];
    if (!apiKey) {
      return mockAnalyzeReport(data as AnalysisInput);
    }
    // A provider call belongs here, prompted with the CRITICAL/HIGH/MODERATE/LOW
    // rules and instructed to return the AnalysisResult JSON shape verbatim.
    return mockAnalyzeReport(data as AnalysisInput);
  });
