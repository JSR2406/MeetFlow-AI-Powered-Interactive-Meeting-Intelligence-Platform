"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Brain,
  LayoutDashboard,
  Video,
  Calendar,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/meetings", icon: Video, label: "Meetings" },
  { href: "/notes", icon: BookOpen, label: "Notes Hub" },
  { href: "/scheduler", icon: Calendar, label: "Scheduler" },
  { href: "/planner", icon: CheckSquare, label: "Planner" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0 animate-pulse-brand">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight truncate">MeetFlow</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-brand" : "text-current"
              )} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI badge */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand/10 text-brand text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            AI Co-pilot Active
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent/60 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
