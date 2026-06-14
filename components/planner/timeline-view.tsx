"use client";

import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Database } from "@/types/database";

type ActionItem = Database["public"]["Tables"]["action_items"]["Row"];
type Meeting = Pick<Database["public"]["Tables"]["meetings"]["Row"], "id" | "title" | "scheduled_at" | "status">;

interface TimelineViewProps {
  items: ActionItem[];
  meetings: Meeting[];
}

export function TimelineView({ items, meetings }: TimelineViewProps) {
  // Group action items by week due date
  const now = new Date();
  const weeks = eachWeekOfInterval({
    start: subWeeks(now, 2),
    end: new Date(now.getTime() + 4 * 7 * 24 * 60 * 60 * 1000),
  });

  const grouped = useMemo(() => {
    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);
      const weekItems = items.filter((item) => {
        if (!item.due_date) return false;
        const due = new Date(item.due_date);
        return due >= weekStart && due <= weekEnd;
      });
      return {
        weekStart,
        label: format(weekStart, "MMM d"),
        items: weekItems,
        count: weekItems.length,
      };
    });
  }, [items, weeks]);

  // Chart: meetings per week
  const meetingsPerWeek = useMemo(() => {
    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);
      const count = meetings.filter((m) => {
        const d = new Date(m.scheduled_at);
        return d >= weekStart && d <= weekEnd;
      }).length;
      return { week: format(weekStart, "MMM d"), meetings: count };
    });
  }, [meetings, weeks]);

  // Items without due dates
  const undated = items.filter((i) => !i.due_date && i.status !== "done");

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "done") return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    if (status === "in_progress") return <Circle className="w-3 h-3 text-blue-500 fill-blue-500/20" />;
    return <Circle className="w-3 h-3 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Meetings chart */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="text-sm font-semibold mb-4">Meetings Per Week</h2>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={meetingsPerWeek} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.12 0 0)",
                border: "1px solid oklch(0.22 0 0)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="meetings" fill="oklch(0.55 0.22 260)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly timeline */}
      <div className="space-y-4">
        {grouped.map((week) => (
          week.items.length > 0 && (
            <div key={week.weekStart.toISOString()}>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Week of {week.label}
                </div>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{week.count} item{week.count !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {week.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-3 rounded-xl border border-border bg-card hover:border-brand/20 transition-colors">
                    <StatusIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.due_date && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="w-2.5 h-2.5" />
                            {item.due_date}
                          </span>
                        )}
                        {item.priority && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Undated items */}
      {undated.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
              No due date
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {undated.map((item) => (
              <div key={item.id} className="flex items-start gap-2 p-3 rounded-xl border border-border bg-card">
                <Circle className="w-3 h-3 text-muted-foreground mt-0.5" />
                <p className="text-xs font-medium truncate">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
