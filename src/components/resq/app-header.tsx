import { Bell, ChevronDown, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SosButton } from "@/components/resq/sos-button";
import { demoAlerts, formatTimeAgo } from "@/data/demo";
import { SeverityBadge } from "@/components/resq/severity-badge";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-4">
        <SidebarTrigger className="shrink-0" />

        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold uppercase tracking-[0.16em] leading-none">
              ResQAI
            </p>
            <p className="mt-0.5 hidden truncate text-[0.7rem] text-muted-foreground sm:block">
              AI-powered disaster response &amp; rescue platform
            </p>
          </div>
          <Badge
            variant="outline"
            className="hidden shrink-0 items-center gap-1.5 border-critical/45 bg-critical/12 text-critical md:inline-flex"
          >
            <span className="relative h-1.5 w-1.5 rounded-full bg-critical" />
            <Radio className="h-3.5 w-3.5" /> Status: Active disaster — Level 3
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <SosButton />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critical" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Active alerts (demo)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {demoAlerts.map((alert) => (
                <DropdownMenuItem key={alert.id} className="flex-col items-start gap-1">
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{alert.title}</span>
                    <SeverityBadge severity={alert.severity} showIcon={false} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {alert.area} · {formatTimeAgo(alert.issuedAt)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-1.5 sm:px-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/70 bg-surface-2 font-display text-sm">
                  AM
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm leading-none">Aarav Mehta</span>
                  <span className="block text-[0.7rem] text-muted-foreground">Citizen · Dehradun</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Demo profile</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Emergency contacts</DropdownMenuItem>
              <DropdownMenuItem>Saved locations</DropdownMenuItem>
              <DropdownMenuItem>Switch to responder view</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
