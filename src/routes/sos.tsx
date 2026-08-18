import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, Siren } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SosButton } from "@/components/resq/sos-button";
import { EmergencyAlertBanner } from "@/components/resq/emergency-alert-banner";
import { EmptyState } from "@/components/resq/states";
import { SOS_TYPE_LABEL, useSosHistory } from "@/lib/sos-store";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "SOS — Emergency Signal | ResQAI" },
      {
        name: "description",
        content:
          "Trigger a simulated SOS with your emergency type, location and message, and review your SOS history in ResQAI.",
      },
      { property: "og:title", content: "SOS — Emergency Signal | ResQAI" },
      {
        property: "og:description",
        content: "Confirmable SOS signal with emergency type, location, message and history.",
      },
    ],
  }),
  component: SosPage,
});

function SosPage() {
  const history = useSosHistory();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-3 sm:p-5">
      <EmergencyAlertBanner
        severity="high"
        title="Prototype SOS"
        message="This screen simulates an SOS dispatch. No emergency service is contacted at any point."
      />

      <Card className="border-critical/40 bg-critical/8 p-5 shadow-panel text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-critical/40 bg-critical/12 text-critical">
          <Siren className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-3 text-2xl font-semibold">Emergency SOS</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          You will be asked to confirm, choose an emergency type and review what is shared before
          anything is sent.
        </p>
        <div className="mx-auto mt-4 max-w-sm">
          <SosButton size="large" />
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">SOS history</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={Siren}
            title="No SOS alerts yet"
            description="Alerts you create appear here with their reference ID, location and status."
          />
        ) : (
          <ul className="space-y-2">
            {history.map((alert) => (
              <li key={alert.id}>
                <Card className="border-border/70 bg-card p-4 shadow-panel">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{alert.id}</p>
                      <h3 className="truncate text-base font-semibold">
                        {SOS_TYPE_LABEL[alert.type]}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    <span className="shrink-0 rounded-md border border-safe/40 bg-safe/12 px-2 py-0.5 text-xs text-safe">
                      {alert.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{alert.location}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
