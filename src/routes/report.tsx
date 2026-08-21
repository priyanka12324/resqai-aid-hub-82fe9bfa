import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Crosshair,
  ImagePlus,
  Loader2,
  Map as MapIcon,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiAnalysisCard } from "@/components/resq/ai-analysis-card";
import { EmergencyAlertBanner } from "@/components/resq/emergency-alert-banner";
import { LoadingPanel } from "@/components/resq/states";
import { mockAnalyzeReport, severityToToken, type AnalysisResult } from "@/lib/ai-analysis";
import { submitDisasterReport } from "@/lib/report-store";
import { useAuth } from "@/lib/auth-context";
import type { DisasterType } from "@/data/demo";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Disaster — ResQAI Citizen Reporting" },
      {
        name: "description",
        content:
          "Submit a flood, landslide, earthquake, fire or road-blockage report and get an instant AI severity assessment with recommended actions.",
      },
      { property: "og:title", content: "Report a Disaster — ResQAI Citizen Reporting" },
      {
        property: "og:description",
        content:
          "Citizen disaster reporting with instant AI triage and recommended safety actions.",
      },
    ],
  }),
  component: ReportPage,
});

const reportTypes: { value: DisasterType | "road" | "building" | "other"; label: string }[] = [
  { value: "flood", label: "Flood" },
  { value: "landslide", label: "Landslide" },
  { value: "earthquake", label: "Earthquake" },
  { value: "fire", label: "Fire" },
  { value: "road", label: "Road blockage" },
  { value: "building", label: "Building damage" },
  { value: "other", label: "Other" },
];

/** Non-core categories are triaged with the closest supported hazard model. */
function toDisasterType(value: string): DisasterType {
  if (value === "road" || value === "building") return "earthquake";
  if (value === "other") return "flood";
  return value as DisasterType;
}

interface FieldErrors {
  location?: string;
  description?: string;
  people?: string;
  lat?: string;
  lng?: string;
}

function ReportPage() {
  const { user } = useAuth();
  const [type, setType] = useState<string>("flood");
  const [locationName, setLocationName] = useState("Rispana Riverside Colony, Dehradun");
  const [lat, setLat] = useState("30.3165");
  const [lng, setLng] = useState("78.0322");
  const [description, setDescription] = useState("");
  const [people, setPeople] = useState("10");
  const [danger, setDanger] = useState<"yes" | "no" | "unknown">("unknown");
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done">("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(4));
          setLng(pos.coords.longitude.toFixed(4));
          toast.success("Current GPS location applied");
        },
        () => {
          setLat("30.3165");
          setLng("78.0322");
          setLocationName("Rispana Riverside Colony, Dehradun");
          toast.info("Demo location applied");
        },
      );
    } else {
      setLat("30.3165");
      setLng("78.0322");
      setLocationName("Rispana Riverside Colony, Dehradun");
      toast.info("Demo location applied");
    }
  };

  const onImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (locationName.trim().length < 3) next.location = "Enter a location name (min 3 characters).";
    if (description.trim().length < 10)
      next.description = "Describe what is happening (min 10 characters).";
    const peopleNumber = Number(people);
    if (!Number.isFinite(peopleNumber) || peopleNumber < 0 || peopleNumber > 1_000_000)
      next.people = "Enter a number between 0 and 1,000,000.";
    const latNumber = Number(lat);
    const lngNumber = Number(lng);
    if (!Number.isFinite(latNumber) || latNumber < -90 || latNumber > 90)
      next.lat = "Latitude must be between -90 and 90.";
    if (!Number.isFinite(lngNumber) || lngNumber < -180 || lngNumber > 180)
      next.lng = "Longitude must be between -180 and 180.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setStatus("analyzing");
    toast.info("Running AI triage on report…");

    try {
      const disasterType = toDisasterType(type);
      const res = await submitDisasterReport({
        type: disasterType,
        title: description.trim().slice(0, 70) || "Citizen incident report",
        description: description.trim(),
        locationName: locationName.trim(),
        lat: Number(lat),
        lng: Number(lng),
        peopleAffected: Number(people),
        immediateDanger: danger,
        imageUrl: imagePreview,
        userId: user?.id ?? null,
      });

      setAnalysis(res.analysis);
      setStatus("done");
      toast.success("Incident report submitted to Supabase", {
        description: `Severity: ${res.analysis.severity} · Code: ${res.report.id}`,
      });
    } catch (err: unknown) {
      console.error("Report submission failed:", err);
      const msg = err instanceof Error ? err.message : "Error saving report";
      toast.error("Could not save report", { description: msg });
      setStatus("idle");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-3 sm:p-5">
      <header>
        <h1 className="text-2xl font-semibold">Report a disaster</h1>
        <p className="text-sm text-muted-foreground">
          Your report is triaged by AI and appears on the dashboard and emergency map. Prototype —
          simulated dispatch only.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="border-border/70 bg-card p-4 shadow-panel sm:p-5">
          <form className="space-y-5" onSubmit={submit} noValidate>
            <div>
              <Label htmlFor="disaster-type">Disaster type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="disaster-type" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                <div className="min-w-0">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={locationName}
                    maxLength={200}
                    onChange={(event) => setLocationName(event.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={useCurrentLocation}>
                  <Crosshair className="h-4 w-4" /> Current
                </Button>
              </div>
              {errors.location && <p className="mt-1 text-xs text-critical">{errors.location}</p>}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lat">Latitude (demo mode)</Label>
                  <Input
                    id="lat"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="mt-1.5"
                  />
                  {errors.lat && <p className="mt-1 text-xs text-critical">{errors.lat}</p>}
                </div>
                <div>
                  <Label htmlFor="lng">Longitude (demo mode)</Label>
                  <Input
                    id="lng"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="mt-1.5"
                  />
                  {errors.lng && <p className="mt-1 text-xs text-critical">{errors.lng}</p>}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-lg border border-border/60 bg-surface-2/60 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/12 text-accent">
                  <MapIcon className="h-5 w-5" aria-hidden />
                </span>
                <p className="min-w-0 text-xs text-muted-foreground">
                  Location preview: <span className="text-foreground">{locationName || "—"}</span>
                  <br />
                  {lat}, {lng} · simulated coordinates
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                maxLength={2000}
                rows={5}
                placeholder="Describe what is happening…"
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1.5"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-critical">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="photo">Upload image (optional)</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" asChild>
                  <label htmlFor="photo" className="cursor-pointer">
                    <ImagePlus className="h-4 w-4" /> Choose photo
                  </label>
                </Button>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onImage(event.target.files?.[0])}
                />
                {imageName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImageName(null);
                      setImagePreview(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview of the uploaded disaster photo"
                  className="mt-3 max-h-48 w-full rounded-lg border border-border/70 object-cover"
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="people">Number of people affected</Label>
                <Input
                  id="people"
                  inputMode="numeric"
                  value={people}
                  onChange={(event) => setPeople(event.target.value.replace(/[^\d]/g, ""))}
                  className="mt-1.5"
                />
                {errors.people && <p className="mt-1 text-xs text-critical">{errors.people}</p>}
              </div>
              <div>
                <Label>Immediate danger?</Label>
                <RadioGroup
                  value={danger}
                  onValueChange={(value) => setDanger(value as typeof danger)}
                  className="mt-2 flex gap-4"
                >
                  {(["yes", "no", "unknown"] as const).map((value) => (
                    <div key={value} className="flex items-center gap-2">
                      <RadioGroupItem id={`danger-${value}`} value={value} />
                      <Label htmlFor={`danger-${value}`} className="capitalize font-normal">
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={status === "analyzing"}>
              {status === "analyzing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing report…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit report
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {status === "idle" && (
            <Card className="border-dashed border-border/70 bg-card/60 p-5">
              <h2 className="text-lg font-semibold">What happens next</h2>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>1. Your report is received and queued for AI triage.</li>
                <li>2. AI assigns severity, hazards and a priority score.</li>
                <li>3. The zone appears on the emergency map for responders.</li>
                <li>4. You receive a recommended action and nearby help.</li>
              </ol>
            </Card>
          )}

          {status === "analyzing" && (
            <>
              <EmergencyAlertBanner
                severity="moderate"
                title="Report received"
                message="AI triage in progress — assigning severity and recommended actions."
              />
              <LoadingPanel rows={1} />
            </>
          )}

          {status === "done" && analysis && (
            <>
              <EmergencyAlertBanner
                severity={severityToToken(analysis.severity)}
                title="Report received"
                message="AI triage complete. Your report is now visible on the dashboard and emergency map."
              />
              <AiAnalysisCard analysis={analysis} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild variant="secondary">
                  <Link to="/emergency-map">
                    <MapIcon className="h-4 w-4" /> View on map
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/find-help">
                    <CheckCircle2 className="h-4 w-4" /> Find nearby help
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
