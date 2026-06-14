"use client";

import { useState } from "react";
import { KanbanBoard } from "./kanban-board";
import { TimelineView } from "./timeline-view";
import { CheckSquare, BarChart2 } from "lucide-react";
import type { Database } from "@/types/database";

type ActionItem = Database["public"]["Tables"]["action_items"]["Row"];
type Meeting = Pick<Database["public"]["Tables"]["meetings"]["Row"], "id" | "title" | "scheduled_at" | "status">;

interface PlannerClientProps {
  initialActionItems: ActionItem[];
  meetings: Meeting[];
  defaultTab: string;
}

export function PlannerClient({ initialActionItems, meetings, defaultTab }: PlannerClientProps) {
  const [tab, setTab] = useState<"kanban" | "timeline">(
    defaultTab === "timeline" ? "timeline" : "kanban"
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planner</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {initialActionItems.length} action items
          </p>
        </div>

        <div className="flex p-1 rounded-xl border border-border bg-secondary/30 gap-1">
          <button
            onClick={() => setTab("kanban")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "kanban" ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground hover:bg-background"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setTab("timeline")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "timeline" ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground hover:bg-background"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Timeline
          </button>
        </div>
      </div>

      {tab === "kanban" ? (
        <KanbanBoard initialItems={initialActionItems} />
      ) : (
        <TimelineView items={initialActionItems} meetings={meetings} />
      )}
    </div>
  );
}
