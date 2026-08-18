import { createFileRoute } from "@tanstack/react-router";

import { Card } from "@/components/ui/card";
import { AiChatWindow } from "@/components/resq/ai-chat-window";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "Emergency AI Assistant — ResQAI Safety Guidance" },
      {
        name: "description",
        content:
          "Ask the ResQAI emergency assistant what to do during floods, landslides and earthquakes, and find the nearest shelter or hospital.",
      },
      { property: "og:title", content: "Emergency AI Assistant — ResQAI Safety Guidance" },
      {
        property: "og:description",
        content: "Concise AI safety guidance for floods, landslides, earthquakes and blocked roads.",
      },
    ],
  }),
  component: AiAssistantPage,
});

function AiAssistantPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-5">
      <header>
        <h1 className="text-2xl font-semibold">Emergency AI assistant</h1>
        <p className="text-sm text-muted-foreground">
          Safety-first guidance built on the ResQAI demo dataset. Not an official emergency
          authority.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <AiChatWindow className="h-[34rem] lg:h-[calc(100vh-14rem)]" />
        <Card className="h-fit border-border/70 bg-card p-4 shadow-panel">
          <h2 className="text-base font-semibold">How to use it</h2>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>Describe your situation in a sentence — the assistant leads with safety steps.</li>
            <li>Use quick actions for flood, landslide, earthquake, shelter and hospital guidance.</li>
            <li>Routes and distances come from demo data and are never guaranteed safe.</li>
            <li>Always follow official instructions from local emergency authorities.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
