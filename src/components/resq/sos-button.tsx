import { useState } from "react";
import { CheckCircle2, Loader2, Siren } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SosButton({
  size = "default",
  className,
}: {
  size?: "default" | "large";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const confirm = () => {
    setState("sending");
    window.setTimeout(() => {
      setState("sent");
      toast.success("SOS logged (demo)", {
        description: "In a live deployment this would alert the district control room.",
      });
    }, 1200);
  };

  const close = () => {
    setOpen(false);
    window.setTimeout(() => setState("idle"), 250);
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
        <DialogContent className="max-w-md">
          {state !== "sent" ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-critical">
                  <Siren className="h-5 w-5" aria-hidden /> Confirm emergency SOS
                </DialogTitle>
                <DialogDescription>
                  This will share your approximate location and profile details with the response
                  team. Only continue if you or someone nearby needs urgent help.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3 text-sm">
                <p className="ops-label">Signal payload</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Location: 30.3165° N, 78.0322° E (approx.)</li>
                  <li>Nearest shelter: Sector 21 Municipal School · 1.2 km</li>
                  <li>Nearest hospital: City General Hospital · 2.1 km</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                Prototype notice: this is a hackathon demo. No emergency service is contacted.
              </p>
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
                    <>Yes, send SOS</>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-safe">
                  <CheckCircle2 className="h-5 w-5" aria-hidden /> SOS recorded (demo)
                </DialogTitle>
                <DialogDescription>
                  Reference SOS-2041 · a responder would normally acknowledge within 5 minutes.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-safe/40 bg-safe/10 p-3 text-sm">
                Stay where you are if it is safe. Keep your phone reachable and conserve battery.
              </div>
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
