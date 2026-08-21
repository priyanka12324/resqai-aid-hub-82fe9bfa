import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Hospital,
  House,
  Loader2,
  Mountain,
  Send,
  Siren,
  Sparkles,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { demoHospitals, demoShelters } from "@/data/demo";
import { AI_DISCLAIMER } from "@/lib/ai-analysis";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const quickActions = [
  { label: "Flood", icon: Waves, prompt: "What should I do during a flood?" },
  { label: "Landslide", icon: Mountain, prompt: "How should I respond to a landslide warning?" },
  { label: "Earthquake", icon: Sparkles, prompt: "What should I do during an earthquake?" },
  { label: "Find Hospital", icon: Hospital, prompt: "Where is the nearest hospital?" },
  { label: "Find Shelter", icon: House, prompt: "Where is the nearest shelter?" },
  { label: "Emergency", icon: Siren, prompt: "I am in immediate danger, what do I do?" },
];

/**
 * Offline guidance engine — deterministic safety answers built from the demo
 * shelter/hospital dataset. Swap for a model call when a provider key is set.
 */
function mockAssistant(question: string, location: string): string {
  const q = question.toLowerCase();
  const shelter = [...demoShelters].sort((a, b) => a.distanceKm - b.distanceKm)[0]!;
  const hospital = [...demoHospitals].sort((a, b) => a.distanceKm - b.distanceKm)[0]!;

  if (/immediate danger|help me|dying|trapped|emergency/.test(q)) {
    return [
      "1. If you can move safely, get away from the hazard and to higher, open ground.",
      "2. Trigger the SOS button so responders receive your location.",
      "3. Call the official emergency number for your area and follow their instructions.",
      "",
      "I am an AI assistant, not an emergency authority. Official instructions always take priority.",
    ].join("\n");
  }
  if (/shelter|relief camp|where can i stay/.test(q)) {
    return [
      `Closest shelter in the demo dataset: ${shelter.name} (${shelter.distanceKm} km, ${shelter.locationName}).`,
      `Status: ${shelter.status}, ${Math.max(0, shelter.capacity - shelter.occupied)} places free.`,
      "Take only essentials, identity documents and medicines.",
      "No route can be guaranteed safe — check the Emergency Map for blocked roads before leaving.",
    ].join("\n");
  }
  if (/hospital|injur|bleeding|medical/.test(q)) {
    return [
      `Closest hospital in the demo dataset: ${hospital.name} (${hospital.distanceKm} km).`,
      `Emergency load: ${hospital.triageLoad}. Beds free: ${hospital.bedsAvailable}, ICU: ${hospital.icuAvailable}.`,
      "For serious bleeding apply firm pressure and keep the person warm while you move.",
      "Confirm availability by phone before travelling; conditions change quickly.",
    ].join("\n");
  }
  if (/flood/.test(q)) {
    return [
      "Flood safety, in priority order:",
      "1. Move upward and inland — never wade or drive through moving water.",
      "2. Switch off mains electricity if you can reach it safely and dry.",
      "3. Carry drinking water, phone, power bank and medicines.",
      `4. Head for an open shelter such as ${shelter.name} (${shelter.distanceKm} km).`,
      "Follow official evacuation orders for your ward above anything I suggest.",
    ].join("\n");
  }
  if (/landslide/.test(q)) {
    return [
      "Landslide warning response:",
      "1. Move away from the slope base and from the debris path, not along it.",
      "2. Avoid hill roads at night and during heavy rain.",
      "3. Watch for new cracks, tilting poles or sudden changes in stream water.",
      "4. Report ground movement so responders can update the map.",
    ].join("\n");
  }
  if (/earthquake|tremor|aftershock/.test(q)) {
    return [
      "During shaking: drop, cover under sturdy furniture, and hold on. Avoid lifts and stairwells.",
      "After shaking: leave damaged buildings, watch for falling debris, and assemble in open ground.",
      "Do not re-enter a cracked building until it has been inspected.",
    ].join("\n");
  }
  if (/road|blocked|route|traffic/.test(q)) {
    return [
      "If your road is blocked, do not attempt to cross debris or floodwater.",
      "Open the Emergency Map and check the blocked-road markers for an alternative.",
      "Report the blockage so other citizens and responders see it.",
      "Routes shown are indicative only and are never guaranteed safe.",
    ].join("\n");
  }
  if (/report/.test(q)) {
    return [
      "To report a disaster: open Report Disaster, pick the type, confirm your location, describe what you see and add a photo if it is safe to take one.",
      "The AI triage assigns a provisional severity and the report appears on the dashboard and map.",
    ].join("\n");
  }
  return [
    `I can help with immediate safety steps, shelters, hospitals and blocked routes around ${location}.`,
    "Try a quick action below, or describe what is happening around you.",
    "I am an AI assistant using demo data — always follow official emergency instructions.",
  ].join("\n");
}

export function AiChatWindow({
  location = "Dehradun",
  className,
}: {
  location?: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `ResQAI emergency assistant online. Location set to ${location}. Ask what to do, or use a quick action. If life is at risk, use SOS and call your official emergency number.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const ask = (question: string) => {
    const trimmed = question.trim().slice(0, 500);
    if (!trimmed || pending) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
    setInput("");
    setPending(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: mockAssistant(trimmed, location) },
      ]);
      setPending(false);
    }, 700);
  };

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col border-border/70 bg-card p-0 shadow-panel",
        className,
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-border/70 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/15 text-primary">
          <Bot className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold uppercase tracking-[0.1em]">
            Emergency AI assistant
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Demo guidance for {location} · not an official authority
          </p>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="space-y-3 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] whitespace-pre-line rounded-xl border px-3.5 py-2.5 text-sm",
                message.role === "user"
                  ? "ml-auto border-primary/40 bg-primary/15"
                  : "border-border/70 bg-surface-2/70",
              )}
            >
              {message.text}
            </div>
          ))}
          {pending && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface-2/70 px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Assessing safest guidance…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 p-3">
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="secondary"
              className="h-8"
              onClick={() => ask(action.prompt)}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask(input);
          }}
        >
          <Input
            value={input}
            maxLength={500}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe your situation or ask a question…"
            aria-label="Message the emergency assistant"
          />
          <Button type="submit" disabled={pending || !input.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-2 text-[0.7rem] text-muted-foreground">{AI_DISCLAIMER}</p>
      </div>
    </Card>
  );
}
