import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMeetingDate, getDurationLabel, getStatusColor } from "@/lib/utils";
import { Video, Plus, Search, Filter } from "lucide-react";
import { MeetingSearchFilter } from "@/components/meetings/meeting-search-filter";

export const metadata = { title: "Meetings" };

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; past?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = teamMemberships?.map((t) => t.team_id) ?? [];

  let query = supabase
    .from("meetings")
    .select("id, title, description, scheduled_at, duration_minutes, status, created_at")
    .order("scheduled_at", { ascending: false });

  if (teamIds.length) query = query.in("team_id", teamIds);
  if (params.status) query = query.eq("status", params.status);
  if (params.past === "true") {
    query = query.lt("scheduled_at", new Date().toISOString());
  } else if (!params.status) {
    // Default: upcoming first
    query = query.order("scheduled_at", { ascending: true });
  }

  const { data: meetings } = await query.limit(50);

  const filtered = params.q
    ? meetings?.filter((m) =>
        m.title.toLowerCase().includes(params.q!.toLowerCase()) ||
        m.description?.toLowerCase().includes(params.q!.toLowerCase())
      )
    : meetings;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered?.length ?? 0} meetings
          </p>
        </div>
        <Link
          href="/scheduler?new=1"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New meeting
        </Link>
      </div>

      <MeetingSearchFilter />

      {!filtered || filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Video className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No meetings found</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {params.q ? `No results for "${params.q}"` : "Schedule your first meeting to get started"}
          </p>
          <Link
            href="/scheduler?new=1"
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Schedule a meeting
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/meetings/${meeting.id}/workspace`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-brand/30 hover:bg-brand/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold group-hover:text-brand transition-colors truncate">
                    {meeting.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${getStatusColor(meeting.status)}`}>
                    {meeting.status}
                  </span>
                </div>
                {meeting.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{meeting.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatMeetingDate(meeting.scheduled_at)} · {getDurationLabel(meeting.duration_minutes)}
                </p>
              </div>
              <div className="text-muted-foreground group-hover:text-brand transition-colors">
                <Search className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
