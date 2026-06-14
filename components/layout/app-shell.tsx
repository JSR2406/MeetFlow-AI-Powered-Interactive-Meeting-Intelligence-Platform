"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "@/components/ui/command-palette";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  user: {
    full_name: string | null;
    email?: string;
    avatar_url?: string | null;
  } | null;
}

export function AppShell({ children, title, user }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={title}
          user={user}
          onSearchOpen={() => setCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
