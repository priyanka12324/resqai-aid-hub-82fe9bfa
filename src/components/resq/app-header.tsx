import { useState } from "react";
import { Bell, ChevronDown, LogIn, LogOut, Radio, Shield, User, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SosButton } from "@/components/resq/sos-button";
import { demoAlerts, formatTimeAgo } from "@/data/demo";
import { SeverityBadge } from "@/components/resq/severity-badge";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { AuthDialog } from "@/components/resq/auth-dialog";

export function AppHeader() {
  const { user, profile, role, signOut, updateRole } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Guest Citizen";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleRoleSwitch = async (newRole: string) => {
    const ok = await updateRole(newRole as AppRole);
    if (ok) {
      toast.success(`Active role switched to ${newRole.toUpperCase()}`);
    }
  };

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
            <span className="relative h-1.5 w-1.5 rounded-full bg-critical animate-pulse" />
            <Radio className="h-3.5 w-3.5" /> Status: Active disaster — Level 3
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <SosButton />
          </div>

          {/* NOTIFICATIONS DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critical" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Active emergency alerts</DropdownMenuLabel>
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

          {/* USER / AUTH DROPDOWN */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-1.5 sm:px-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/70 bg-primary/20 text-primary font-display text-sm font-bold">
                    {initials}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm leading-none">{displayName}</span>
                    <span className="block text-[0.7rem] text-muted-foreground capitalize">
                      {role} {profile?.phone ? `· ${profile.phone}` : ""}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Switch Active Role (RBAC)
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={role} onValueChange={handleRoleSwitch}>
                  <DropdownMenuRadioItem value="citizen">
                    <User className="mr-2 h-4 w-4" /> Citizen
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="responder">
                    <UserCheck className="mr-2 h-4 w-4 text-accent" /> Responder
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="admin">
                    <Shield className="mr-2 h-4 w-4 text-critical" /> Admin / Commander
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    toast.info("Signed out");
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-semibold border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => {
                  setAuthTab("login");
                  setAuthOpen(true);
                }}
              >
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Button>
            </div>
          )}
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </header>
  );
}
