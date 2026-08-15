import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  LayoutDashboard,
  LifeBuoy,
  Map,
  ShieldCheck,
  Siren,
  TriangleAlert,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const citizenItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Emergency Map", url: "/emergency-map", icon: Map },
  { title: "Report Disaster", url: "/report", icon: TriangleAlert },
  { title: "Find Help", url: "/find-help", icon: LifeBuoy },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "SOS", url: "/sos", icon: Siren },
] as const;

const adminItems = [{ title: "Admin Dashboard", url: "/admin", icon: ShieldCheck }] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (router) => router.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/15 text-primary">
            <Siren className="h-5 w-5" aria-hidden />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold uppercase tracking-[0.14em]">
                ResQAI
              </span>
              <span className="block truncate text-[0.7rem] text-muted-foreground">
                Disaster response console
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Response</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {citizenItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="border-t border-sidebar-border/70 p-3">
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            Hackathon prototype. Demo data only — not a live emergency service.
          </p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
