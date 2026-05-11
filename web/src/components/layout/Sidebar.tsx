"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Lightbulb,
  FlaskConical,
  PenTool,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  FileText,
  Terminal,
} from "lucide-react";

interface NavItemDef {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  external?: boolean;
}

const mainNavItems: NavItemDef[] = [
  { label: "知识空间", href: "/knowledge", icon: BookOpen, badge: "MVP" },
  { label: "Claude Code", href: "/claude", icon: Terminal, badge: "New" },
  { label: "洞察引擎", href: "/insights", icon: Lightbulb, badge: "Soon" },
  { label: "实验台", href: "/lab", icon: FlaskConical, badge: "Soon" },
  { label: "学者工坊", href: "/studio", icon: PenTool, badge: "Soon" },
  { label: "协作网络", href: "/nexus", icon: Users, badge: "Soon" },
];

const bottomNavItems: NavItemDef[] = [
  {
    label: "开发文档",
    href: "https://github.com/kun2-5/ai4research/blob/main/CLAUDE.md",
    icon: FileText,
  },
  { label: "设置", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <Hexagon className="h-6 w-6 text-primary shrink-0" />
          <span className="text-lg font-bold tracking-tight whitespace-nowrap">
            ResearchOS
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Main Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      "overflow-hidden transition-all whitespace-nowrap",
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0",
                        item.badge === "MVP"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Bottom Navigation */}
      <div className="py-4 px-2">
        <nav className="flex flex-col gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      "overflow-hidden transition-all whitespace-nowrap",
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
