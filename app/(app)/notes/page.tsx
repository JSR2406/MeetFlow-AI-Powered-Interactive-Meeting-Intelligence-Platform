import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMeetingDate, getDurationLabel, getStatusColor } from "@/lib/utils";
import { BookOpen, Video, MessageSquare, FileText, Search, ChevronRight, Clock } from "lucide-react";

export const metadata = { title: "Notes Hub — All Meeting Notes" };

// ── Demo Data ──────────────────────────────────────────────────────────────
const now = new Date();
const DEMO_NOTES_HUB = [
  {
    meeting: { id: "m1", title: "Q3 Planning Session", scheduled_at: new Date(now.getTime() - 2 * 3600000).toISOString(), duration_minutes: 60, status: "completed" },
    hasNotes: true,
    hasTranscript: true,
    actionItemCount: 4,
    summary: "Team aligned on Q3 priorities: AI summarization beta by July, iOS app launch, enterprise SSO. Revenue at 87% of Q2 target.",
    aiMessages: 6,
    notesPreview: "Q3 Priorities: AI Meeting Summaries 🤖 · Mobile App 📱 · Enterprise SSO 🔐",
  },
  {
    meeting: { id: "m2", title: "Product Standup", scheduled_at: new Date(now.getTime() - 26 * 3600000).toISOString(), duration_minutes: 15, status: "completed" },
    hasNotes: true,
    hasTranscript: true,
    actionItemCount: 2,
    summary: "Standup covered: search indexing on track, PRs reviewed, mobile designs ETA Friday.",
    aiMessages: 3,
    notesPreview: "Blockers: none. PRs merged: 4. Next: finalize mobile wireframes.",
  },
  {
    meeting: { id: "m4", title: "Engineering Retrospective", scheduled_at: new Date(now.getTime() - 48 * 3600000).toISOString(), duration_minutes: 60, status: "completed" },
    hasNotes: true,
    hasTranscript: true,
    actionItemCount: 6,
    summary: "Sprint 24 retro — Went well: fast deploys, team communication. Improve: estimation accuracy, PR review turnaround.",
    aiMessages: 8,
    notesPreview: "Start: async standup updates. Stop: last-minute scope changes. Continue: pair programming sessions.",
  },
  {
    meeting: { id: "m5", title: "All-Hands Meeting", scheduled_at: new Date(now.getTime() - 72 * 3600000).toISOString(), duration_minutes: 90, status: "completed" },
    hasNotes: true,
    hasTranscript: false,
    actionItemCount: 3,
    summary: "Company update: 32% YoY growth, new enterprise customers, hiring plan for Q3 (8 engineers, 3 PMs).",
    aiMessages: 2,
    notesPreview: "Company ARR: $4.2M. New customers: Stripe, Notion, Linear. Open roles posted on LinkedIn.",
  },
  {
    meeting: { id: "m3", title: "Design Review — v2 Dashboard", scheduled_at: new Date(now.getTime() + 25 * 3600000).toISOString(), duration_minutes: 45, status: "scheduled" },
    hasNotes: false,
    hasTranscript: false,
    actionItemCount: 0,
    summary: null,
    aiMessages: 0,
    notesPreview: null,
  },
  {
    meeting: { id: "m6", title: "Sprint Demo — Live 🔴", scheduled_at: new Date(now.getTime() - 30 * 60000).toISOString(), duration_minutes: 30, status: "live" },
    hasNotes: true,
    hasTranscript: false,
    actionItemCount: 1,
    summary: null,
    aiMessages: 1,
    notesPreview: "Live notes being taken... Feature demo: real-time transcript panel, AI chat, drag-drop kanban.",
  },
];

export default async function NotesHubPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return <NotesHubView items={DEMO_NOTES_HUB} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: teamMemberships } = await supabase
    .from("team_members").select("team_id").eq("user_id", user.id);
  const teamIds = teamMemberships?.map((t) => t.team_id) ?? [];

  if (!teamIds.length) return <NotesHubView items={[]} />;

  // Fetch meetings + notes + transcripts + action item counts in parallel
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, scheduled_at, duration_minutes, status")
    .in("team_id", teamIds)
    .order("scheduled_at", { ascending: false })
    .limit(50);

  if (!meetings?.length) return <NotesHubView items={[]} />;

  const meetingIds = meetings.map((m) => m.id);

  const [notesRes, transcriptRes, actionRes, aiRes] = await Promise.all([
    supabase.from("notes").select("meeting_id, content, updated_at").in("meeting_id", meetingIds),
    supabase.from("transcripts").select("meeting_id, created_at").in("meeting_id", meetingIds),
    supabase.from("action_items").select("meeting_id").in("meeting_id", meetingIds),
    supabase.from("ai_messages").select("meeting_id").in("meeting_id", meetingIds),
  ]);

  const notesMap = Object.fromEntries((notesRes.data ?? []).map((n) => [n.meeting_id, n]));
  const transcriptSet = new Set((transcriptRes.data ?? []).map((t) => t.meeting_id));
  const actionCount = (actionRes.data ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.meeting_id] = (acc[a.meeting_id] ?? 0) + 1; return acc;
  }, {});
  const aiCount = (aiRes.data ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.meeting_id] = (acc[a.meeting_id] ?? 0) + 1; return acc;
  }, {});

  const items = meetings.map((m) => ({
    meeting: m,
    hasNotes: !!notesMap[m.id],
    hasTranscript: transcriptSet.has(m.id),
    actionItemCount: actionCount[m.id] ?? 0,
    aiMessages: aiCount[m.id] ?? 0,
    summary: null,
    notesPreview: null,
  }));

  return <NotesHubView items={items} />;
}

type NotesItem = (typeof DEMO_NOTES_HUB)[number];

function NotesHubView({ items }: { items: NotesItem[] }) {
  const completed = items.filter((i) => i.meeting.status === "completed" || i.meeting.status === "live");
  const upcoming = items.filter((i) => i.meeting.status === "scheduled");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand" />
            Notes Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            All meeting notes, transcripts, and AI conversations in one place
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 bg-secondary/30">
          <Search className="w-3.5 h-3.5" />
          <span>{items.length} meetings total · {completed.filter(i => i.hasNotes).length} with notes</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Meetings with Notes", value: items.filter(i => i.hasNotes).length, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Transcripts Saved", value: items.filter(i => i.hasTranscript).length, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Total Action Items", value: items.reduce((s, i) => s + i.actionItemCount, 0), icon: ChevronRight, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "AI Conversations", value: items.reduce((s, i) => s + i.aiMessages, 0), icon: MessageSquare, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent meetings with notes */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Meetings</h2>
          <div className="space-y-3">
            {completed.map((item) => (
              <Link
                key={item.meeting.id}
                href={`/meetings/${item.meeting.id}/workspace`}
                className="block p-4 rounded-2xl border border-border bg-card hover:border-brand/30 hover:bg-brand/5 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.meeting.status === "live" ? "bg-brand/20" : "bg-secondary"
                    }`}>
                      <Video className={`w-4 h-4 ${item.meeting.status === "live" ? "text-brand animate-pulse" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold group-hover:text-brand transition-colors">{item.meeting.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(item.meeting.status)}`}>
                          {item.meeting.status}
                        </span>
                        {item.hasTranscript && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-medium">📝 Transcript</span>
                        )}
                        {item.aiMessages > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">🤖 {item.aiMessages} AI msgs</span>
                        )}
                        {item.actionItemCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-medium">✅ {item.actionItemCount} items</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatMeetingDate(item.meeting.scheduled_at)} · {getDurationLabel(item.meeting.duration_minutes)}
                      </p>
                      {item.summary && (
                        <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed border-l-2 border-brand/30 pl-2">
                          <span className="text-brand font-medium">AI Summary:</span> {item.summary}
                        </p>
                      )}
                      {item.notesPreview && !item.summary && (
                        <p className="text-xs text-muted-foreground/70 mt-2 italic">{item.notesPreview}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming — no notes yet */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming — Notes Pending</h2>
          <div className="space-y-2">
            {upcoming.map((item) => (
              <Link
                key={item.meeting.id}
                href={`/meetings/${item.meeting.id}/workspace`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-border/60 bg-secondary/20 hover:border-brand/30 hover:bg-brand/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">{item.meeting.title}</h3>
                  <p className="text-xs text-muted-foreground/60">{formatMeetingDate(item.meeting.scheduled_at)} · Notes will appear here after the meeting</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-brand transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No meeting notes yet</h2>
          <p className="text-muted-foreground text-sm mb-4">Notes, transcripts and AI summaries will appear here after your meetings</p>
          <Link href="/scheduler?new=1" className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors">
            Schedule your first meeting
          </Link>
        </div>
      )}
    </div>
  );
}
