"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { NewMeetingDialog } from "./new-meeting-dialog";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
}

interface SchedulerClientProps {
  meetings: Meeting[];
  openNewMeeting?: boolean;
}

export function SchedulerClient({ meetings, openNewMeeting = false }: SchedulerClientProps) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(openNewMeeting);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const events = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    start: new Date(m.scheduled_at),
    end: new Date(new Date(m.scheduled_at).getTime() + m.duration_minutes * 60000),
    resource: m,
  }));

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start);
    setDialogOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: { id: string }) => {
    window.location.href = `/meetings/${event.id}/workspace`;
  }, []);

  const navigate = (direction: "PREV" | "NEXT" | "TODAY") => {
    if (direction === "TODAY") { setDate(new Date()); return; }
    const d = new Date(date);
    if (view === "month") d.setMonth(d.getMonth() + (direction === "NEXT" ? 1 : -1));
    else if (view === "week") d.setDate(d.getDate() + (direction === "NEXT" ? 7 : -7));
    else d.setDate(d.getDate() + (direction === "NEXT" ? 1 : -1));
    setDate(d);
  };

  return (
    <div className="p-6 h-[calc(100vh-56px)] flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <CalIcon className="w-4 h-4 text-brand" />
          </div>
          <h1 className="text-xl font-bold">Scheduler</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex p-1 rounded-xl border border-border bg-secondary/30 gap-1">
            {(["month", "week", "day"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  view === v ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("PREV")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("TODAY")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate("NEXT")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(date, view === "month" ? "MMMM yyyy" : view === "week" ? "'Week of' MMM d" : "MMMM d, yyyy")}
          </span>

          <button
            onClick={() => { setSelectedDate(null); setDialogOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Meeting
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          toolbar={false}
          style={{ height: "100%", padding: "16px" }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.resource?.status === "completed"
                ? "oklch(0.55 0 0)"
                : event.resource?.status === "live"
                ? "oklch(0.5 0.2 142)"
                : "oklch(0.55 0.22 260)",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            },
          })}
        />
      </div>

      <NewMeetingDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedDate(null); }}
        defaultDate={selectedDate}
      />
    </div>
  );
}
