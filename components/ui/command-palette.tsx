"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk";
import { LayoutDashboard, Video, Calendar, CheckSquare, Settings, Plus } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const navigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <CommandDialog open={open} onOpenChange={onOpenChange} label="Command palette">
          <CommandInput
            placeholder="Search or jump to..."
            className="w-full px-4 py-4 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
          />
          <CommandList className="max-h-80 overflow-y-auto p-2">
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>

            <CommandGroup heading="Navigation" className="text-xs text-muted-foreground px-2 py-1">
              <CommandItem onSelect={() => navigate("/dashboard")} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary text-sm">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </CommandItem>
              <CommandItem onSelect={() => navigate("/meetings")} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary text-sm">
                <Video className="w-4 h-4" /> Meetings
              </CommandItem>
              <CommandItem onSelect={() => navigate("/scheduler")} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary text-sm">
                <Calendar className="w-4 h-4" /> Scheduler
              </CommandItem>
              <CommandItem onSelect={() => navigate("/planner")} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary text-sm">
                <CheckSquare className="w-4 h-4" /> Planner
              </CommandItem>
              <CommandItem onSelect={() => navigate("/settings")} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary text-sm">
                <Settings className="w-4 h-4" /> Settings
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="border-t border-border my-1" />

            <CommandGroup heading="Actions" className="text-xs text-muted-foreground px-2 py-1">
              <CommandItem onSelect={() => navigate("/scheduler?new=1")} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary text-sm text-brand">
                <Plus className="w-4 h-4" /> New meeting
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </div>
  );
}
