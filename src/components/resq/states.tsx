import type { LucideIcon } from "lucide-react";
import { AlertOctagon, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingPanel({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} className="border-border/70 bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="mt-3 h-12 w-full rounded-lg" />
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="grid place-items-center border-dashed border-border/70 bg-card/60 px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-border/70 bg-surface-2 text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

export function ErrorState({
  title = "Could not load data",
  description = "The simulated data feed did not respond. Retry to reload the demo dataset.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="grid place-items-center border-critical/40 bg-critical/8 px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-critical/40 bg-critical/12 text-critical">
        <AlertOctagon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      )}
    </Card>
  );
}
