import {
  mockAnalyzeReport,
  type AnalysisInput,
  type AnalysisResult,
  type SeverityLevel,
} from "@/lib/ai-analysis";

/**
 * Server-only AI triage. Calls the Lovable AI gateway with the report data and
 * falls back to the deterministic offline analyser whenever the model is
 * unavailable, rate-limited or returns an unusable payload — so a report is
 * never lost because AI failed.
 *
 * The API key is read here, inside server-only code, and never sent to the
 * browser.
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `You are the triage engine of ResQAI, a disaster-response platform.
Assess the citizen report and reply with JSON only, matching exactly:
{"severity":"LOW|MODERATE|HIGH|CRITICAL","priority_score":0-100,"summary":"2 sentences max","detected_hazards":["..."],"recommended_actions":["..."],"risk_level":"short phrase","affected_area":"short phrase","insufficient_information":true|false}
Rules:
- CRITICAL: immediate threat to life or severe infrastructure damage.
- HIGH: significant danger requiring urgent assistance.
- MODERATE: damage or risk exists but immediate life threat is unclear.
- LOW: minor or informational.
Never invent facts that are not in the report. If the description is too vague, set insufficient_information to true and keep severity provisional. Always tell people to follow official emergency instructions.`;

const SEVERITIES: SeverityLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];

function coerce(raw: unknown, input: AnalysisInput): AnalysisResult | null {
  if (raw == null || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const severity = String(value["severity"] ?? "").toUpperCase() as SeverityLevel;
  if (!SEVERITIES.includes(severity)) return null;
  const score = Number(value["priority_score"]);
  const list = (key: string, fallback: string[]) => {
    const arr = value[key];
    if (!Array.isArray(arr)) return fallback;
    const clean = arr
      .map((item) => String(item).slice(0, 160))
      .filter(Boolean)
      .slice(0, 6);
    return clean.length ? clean : fallback;
  };
  const summary = String(value["summary"] ?? "").slice(0, 600);
  if (!summary) return null;

  return {
    disasterType: input.disasterType,
    severity,
    riskLevel: String(value["risk_level"] ?? severity).slice(0, 120),
    summary,
    detectedHazards: list("detected_hazards", ["Unverified on-ground conditions"]),
    recommendedActions: list("recommended_actions", ["Follow official emergency instructions."]),
    priorityScore: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
    affectedArea: String(value["affected_area"] ?? `Near ${input.location}`).slice(0, 160),
    simulated: false,
    insufficientInformation: Boolean(value["insufficient_information"]),
  };
}

export async function analyzeReport(input: AnalysisInput): Promise<AnalysisResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return mockAnalyzeReport(input);

  try {
    const response = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              `Disaster type: ${input.disasterType}`,
              `Location: ${input.location}`,
              `People affected: ${input.peopleAffected}`,
              `Immediate danger: ${input.immediateDanger}`,
              `Photo attached: ${input.image ? "yes" : "no"}`,
              `Description: ${input.description}`,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI triage failed", response.status, await response.text().catch(() => ""));
      return mockAnalyzeReport(input);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return mockAnalyzeReport(input);

    const parsed = coerce(JSON.parse(content), input);
    return parsed ?? mockAnalyzeReport(input);
  } catch (error) {
    console.error("AI triage error", error);
    return mockAnalyzeReport(input);
  }
}
