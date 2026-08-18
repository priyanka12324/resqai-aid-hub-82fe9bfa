import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShelterCard } from "@/components/resq/shelter-card";
import { HospitalCard } from "@/components/resq/hospital-card";
import { EmptyState } from "@/components/resq/states";
import { demoHospitals, demoShelters } from "@/data/demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/find-help")({
  head: () => ({
    meta: [
      { title: "Find Help — Shelters, Relief Camps & Hospitals | ResQAI" },
      {
        name: "description",
        content:
          "Discover nearby shelters, relief camps and hospitals with capacity, availability and directions during a disaster.",
      },
      { property: "og:title", content: "Find Help — Shelters, Relief Camps & Hospitals | ResQAI" },
      {
        property: "og:description",
        content: "Nearby shelters, relief camps and hospitals with live-style capacity indicators.",
      },
    ],
  }),
  component: FindHelpPage,
});

type SortMode = "nearest" | "available";
type Category = "all" | "shelters" | "relief-camps" | "hospitals";

function FindHelpPage() {
  const [sort, setSort] = useState<SortMode>("nearest");
  const [category, setCategory] = useState<Category>("all");

  const shelters = useMemo(() => {
    const list = demoShelters.filter((shelter) =>
      category === "shelters"
        ? shelter.kind === "shelter"
        : category === "relief-camps"
          ? shelter.kind === "relief-camp"
          : category !== "hospitals",
    );
    return [...list].sort((a, b) =>
      sort === "nearest"
        ? a.distanceKm - b.distanceKm
        : b.capacity - b.occupied - (a.capacity - a.occupied),
    );
  }, [category, sort]);

  const hospitals = useMemo(() => {
    if (category === "shelters" || category === "relief-camps") return [];
    return [...demoHospitals].sort((a, b) =>
      sort === "nearest" ? a.distanceKm - b.distanceKm : b.bedsAvailable - a.bedsAvailable,
    );
  }, [category, sort]);

  const recommended = useMemo(
    () =>
      [...demoShelters]
        .filter((shelter) => shelter.status === "open")
        .sort(
          (a, b) =>
            (b.capacity - b.occupied) / b.capacity - a.distanceKm / 10 -
            ((a.capacity - a.occupied) / a.capacity - b.distanceKm / 10),
        )[0],
    [],
  );

  const directions = (name: string) =>
    toast.info(`Directions to ${name}`, {
      description: "Demo only — no external routing service is connected.",
    });

  const filters: { key: Category | SortMode; label: string; active: boolean; onClick: () => void }[] = [
    { key: "nearest", label: "Nearest", active: sort === "nearest", onClick: () => setSort("nearest") },
    {
      key: "available",
      label: "Most available",
      active: sort === "available",
      onClick: () => setSort("available"),
    },
    { key: "all", label: "All", active: category === "all", onClick: () => setCategory("all") },
    {
      key: "shelters",
      label: "Shelters",
      active: category === "shelters",
      onClick: () => setCategory("shelters"),
    },
    {
      key: "relief-camps",
      label: "Relief camps",
      active: category === "relief-camps",
      onClick: () => setCategory("relief-camps"),
    },
    {
      key: "hospitals",
      label: "Hospitals",
      active: category === "hospitals",
      onClick: () => setCategory("hospitals"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[100rem] space-y-5 p-3 sm:p-5">
      <header>
        <h1 className="text-2xl font-semibold">Find help</h1>
        <p className="text-sm text-muted-foreground">
          Shelters, relief camps and hospitals near you. All figures below are simulated demo data.
        </p>
      </header>

      {recommended && (
        <Card className="border-safe/40 bg-safe/8 p-4 shadow-panel sm:p-5">
          <p className="ops-label inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Recommended shelter
          </p>
          <h2 className="mt-1 text-xl font-semibold">{recommended.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recommended because it has high available capacity (
            {recommended.capacity - recommended.occupied} of {recommended.capacity} places free), is{" "}
            {recommended.distanceKm} km away, and sits outside the currently reported affected zone.
          </p>
          <Button className="mt-3" size="sm" onClick={() => directions(recommended.name)}>
            Get directions
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            size="sm"
            variant={filter.active ? "default" : "secondary"}
            className={cn("h-8", filter.active && "shadow-panel")}
            onClick={filter.onClick}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {shelters.length === 0 && hospitals.length === 0 && (
        <EmptyState
          title="Nothing matches these filters"
          description="Try switching back to All to see every shelter, relief camp and hospital in the demo dataset."
          actionLabel="Reset filters"
          onAction={() => setCategory("all")}
        />
      )}

      {shelters.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Shelters &amp; relief camps</h2>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {shelters.map((shelter) => (
              <ShelterCard
                key={shelter.id}
                shelter={shelter}
                onNavigate={() => directions(shelter.name)}
              />
            ))}
          </div>
        </section>
      )}

      {hospitals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Hospitals</h2>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {hospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                onNavigate={() => directions(hospital.name)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
