import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  MapPinned,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SeverityBadge } from "@/components/resq/severity-badge";
import { AI_DISCLAIMER, severityToToken, type AnalysisResult } from "@/lib/ai-analysis";
import { DISASTER_LABEL, type DisasterType } from "@/data/demo";

export function AiAnalysisCard({ analysis }: { analysis: AnalysisResult }) {
  return (
    <Card className="border-primary/30 bg-card p-5 shadow-panel">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="ops-label inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> AI analysis
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {DISASTER_LABEL[analysis.disasterType as DisasterType] ?? analysis.disasterType}{" "}
            assessment
          </h3>
        </div>
        <SeverityBadge severity={severityToToken(analysis.severity)} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-3">
          <p className="ops-label inline-flex items-center gap-1">
            <Gauge className="h-3 w-3" aria-hidden /> Risk level
          </p>
          <p className="mt-1 text-sm font-medium">{analysis.riskLevel}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-3">
          <p className="ops-label inline-flex items-center gap-1">
            <MapPinned className="h-3 w-3" aria-hidden /> Affected area
          </p>
          <p className="mt-1 text-sm font-medium">{analysis.affectedArea}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/60 p-3">
          <p className="ops-label">Priority score</p>
          <p className="mt-1 font-display text-xl tabular-nums">{analysis.priorityScore}/100</p>
          <Progress value={analysis.priorityScore} className="mt-1.5 h-1.5" />
        </div>
      </div>

      <div className="mt-4">
        <p className="ops-label">AI summary</p>
        <p className="mt-1 text-sm text-muted-foreground">{analysis.summary}</p>
      </div>

      {analysis.insufficientInformation && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-moderate/40 bg-moderate/10 p-3 text-sm">
          <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-moderate" aria-hidden />
          <span>
            Insufficient information for a confident assessment. Add more detail or a photo so the
            severity can be re-evaluated.
          </span>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="ops-label inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden /> Detected hazards
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {analysis.detectedHazards.map((hazard) => (
              <Badge key={hazard} variant="outline" className="border-border/70 font-normal">
                {hazard}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="ops-label inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" aria-hidden /> Recommended actions
          </p>
          <ul className="mt-2 space-y-1.5">
            {analysis.recommendedActions.map((action) => (
              <li key={action} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        {AI_DISCLAIMER}
        {analysis.simulated && " Running in demo mode with the offline analyser."}
      </p>
    </Card>
  );
}
