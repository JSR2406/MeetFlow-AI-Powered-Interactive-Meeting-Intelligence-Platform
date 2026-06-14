"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Bell, Search, LogOut, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

interface TopbarProps {
  title?: string;
  user: {
    full_name: string | null;
    email?: string;
    avatar_url?: string | null;
  } | null;
  onSearchOpen?: () => void;
}

export function Topbar({ title, user, onSearchOpen }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-sm font-semibold text-foreground/80">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={onSearchOpen}
          aria-label="Open search"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Search</span>
          <kbd className="hidden sm:block text-[10px] px-1 py-0.5 rounded bg-muted">⌘K</kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-semibold">
              {getInitials(user?.full_name)}
            </div>
            <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate">
              {user?.full_name ?? "User"}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-popover shadow-lg z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium truncate">{user?.full_name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { router.push("/settings"); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-sm transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-sm transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
