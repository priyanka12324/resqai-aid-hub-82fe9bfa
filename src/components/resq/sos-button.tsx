import { useState } from "react";
import { CheckCircle2, Loader2, Siren } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendSosAlert, SOS_TYPE_LABEL, type SosAlert, type SosType } from "@/lib/sos-store";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const DEMO_LOCATION = "Rispana Riverside Colony, Dehradun";
const DEMO_COORDS = "30.3165° N, 78.0322° E (approx.)";

export function SosButton({
  size = "default",
  className,
}: {
  size?: "default" | "large";
  className?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [type, setType] = useState<SosType>("trapped");
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState<SosAlert | null>(null);

  const confirm = async () => {
    setState("sending");
    try {
      const created = await sendSosAlert({
        type,
        message: message.trim().slice(0, 300),
        location: DEMO_LOCATION,
        coords: DEMO_COORDS,
        lat: 30.3165,
        lng: 78.0322,
        userId: user?.id ?? null,
      });
      setAlert(created);
      setState("sent");
      toast.success("SOS distress signal sent to Command Center", {
        description: `Alert Reference: ${created.id}`,
      });
    } catch (err: unknown) {
      console.error("SOS transmission error:", err);
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error("Failed to transmit SOS", { description: msg });
      setState("idle");
    }
  };

  const close = () => {
    setOpen(false);
    window.setTimeout(() => {
      setState("idle");
      setMessage("");
      setAlert(null);
    }, 250);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative inline-flex items-center justify-center gap-3 rounded-xl border border-critical/50 bg-critical text-critical-foreground shadow-alert transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-critical",
          size === "large" ? "w-full px-6 py-6" : "px-4 py-2.5",
          className,
        )}
      >
        <span className="relative grid place-items-center">
          <Siren className={cn(size === "large" ? "h-8 w-8" : "h-5 w-5")} aria-hidden />
        </span>
        <span className="text-left">
          <span
            className={cn(
              "block font-display uppercase tracking-[0.16em]",
              size === "large" ? "text-2xl" : "text-sm",
            )}
          >
            SOS
          </span>
          {size === "large" && (
            <span className="block text-xs opacity-90">Send emergency signal with my location</span>
          )}
        </span>
      </button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          {state !== "sent" ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-critical">
                  <Siren className="h-5 w-5" aria-hidden /> Are you in immediate danger?
                </DialogTitle>
                <DialogDescription>
                  Review what will be shared, then confirm. Prototype only — no emergency service is
                  contacted.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="sos-type">Emergency type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as SosType)}>
                    <SelectTrigger id="sos-type" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOS_TYPE_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sos-message">Message (optional)</Label>
                  <Textarea
                    id="sos-message"
                    value={message}
                    maxLength={300}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="How many people, injuries, what you can see…"
                    className="mt-1.5"
                    rows={3}
                  />
                </div>

                <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3 text-sm">
                  <p className="ops-label">Signal payload</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>Location: {DEMO_LOCATION}</li>
                    <li>Coordinates: {DEMO_COORDS}</li>
                    <li>Timestamp: {new Date().toLocaleString()}</li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={close} disabled={state === "sending"}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirm} disabled={state === "sending"}>
                  {state === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>Send SOS</>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-safe">
                  <CheckCircle2 className="h-5 w-5" aria-hidden /> SOS alert created
                </DialogTitle>
                <DialogDescription>
                  Simulated dispatch — this prototype does not contact emergency services.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 rounded-lg border border-safe/40 bg-safe/10 p-3 text-sm">
                <p>
                  <span className="ops-label">SOS ID</span> {alert?.id}
                </p>
                <p>
                  <span className="ops-label">Type</span> {alert ? SOS_TYPE_LABEL[alert.type] : ""}
                </p>
                <p>
                  <span className="ops-label">Location</span> {alert?.location}
                </p>
                <p>
                  <span className="ops-label">Time</span>{" "}
                  {alert ? new Date(alert.createdAt).toLocaleString() : ""}
                </p>
                <p>
                  <span className="ops-label">Status</span> {alert?.status}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Stay where you are if it is safe, keep your phone reachable and conserve battery.
              </p>
              <DialogFooter>
                <Button onClick={close}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
