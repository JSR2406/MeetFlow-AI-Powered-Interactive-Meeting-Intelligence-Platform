import { redirect, notFound } from "next/navigation";
import { WorkspaceClient } from "@/components/meetings/workspace-client";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const titles: Record<string, string> = {
      m1: "Q3 Planning Session", m2: "Product Standup", m3: "Design Review — v2 Dashboard",
      m4: "Engineering Retrospective", m5: "All-Hands Meeting", m6: "Sprint Demo — Live 🔴",
    };
    return { title: titles[id] ?? "Meeting Workspace" };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("meetings").select("title").eq("id", id).single();
  return { title: data?.title ?? "Workspace" };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_MEETING = {
  id: "m1",
  title: "Q3 Planning Session",
  description: "Quarterly goals, OKR review and roadmap alignment",
  scheduled_at: new Date().toISOString(),
  duration_minutes: 60,
  status: "live" as const,
  team_id: "team-demo",
  created_by: "demo-user",
  created_at: new Date().toISOString(),
};

const DEMO_AGENDA = [
  { id: "a1", meeting_id: "m1", position: 0, title: "Welcome & Introductions", duration_minutes: 5, notes: null, created_at: new Date().toISOString() },
  { id: "a2", meeting_id: "m1", position: 1, title: "Q2 OKR Review", duration_minutes: 15, notes: "Review what we achieved vs targets", created_at: new Date().toISOString() },
  { id: "a3", meeting_id: "m1", position: 2, title: "Q3 Roadmap Discussion", duration_minutes: 25, notes: "Align on priorities for next quarter", created_at: new Date().toISOString() },
  { id: "a4", meeting_id: "m1", position: 3, title: "Action Items & Next Steps", duration_minutes: 10, notes: null, created_at: new Date().toISOString() },
  { id: "a5", meeting_id: "m1", position: 4, title: "Wrap-up", duration_minutes: 5, notes: null, created_at: new Date().toISOString() },
];

const DEMO_TRANSCRIPT = {
  id: "t1",
  meeting_id: "m1",
  raw_text: `[00:00] Sarah Chen (VP Engineering): Good morning everyone! Let's get started with our Q3 planning session. We have a lot to cover today.

[00:45] James Liu (PM): Thanks Sarah. So first up — Q2 OKRs. We hit 87% of our revenue target, shipped the new search feature on time, and onboarding conversion went up 12%.

[02:10] Sarah Chen: Great work team. The API performance improvements were critical. Response times are down 40%.

[03:30] Priya Patel (Design): The v2 dashboard redesign is ready for engineering handoff. We got really positive feedback in user testing — NPS went up 8 points.

[05:00] James Liu: For Q3, I'm proposing we focus on: (1) AI-powered meeting summaries, (2) mobile app launch, and (3) enterprise SSO integration.

[06:45] Sarah Chen: Agreed on the AI meeting summaries — that's our core differentiator. We should ship a beta by end of July.

[08:20] David Park (Lead Eng): I can take the AI summarization backend. We'll need to finalize the prompt templates and set up the streaming infrastructure.

[10:00] James Liu: Mobile app — we should prioritize iOS first. Android by Q4.

[11:30] Sarah Chen: Action items: David owns AI backend, Priya owns mobile designs, James to finalize Q3 OKR doc by Friday. Let's meet again next week to review progress.

[12:00] Everyone: Sounds great. Thanks all!`,
  language: "en",
  created_at: new Date().toISOString(),
};

const DEMO_ACTION_ITEMS = [
  { id: "ai1", meeting_id: "m1", title: "David to build AI summarization backend — beta by end of July", description: "Set up streaming infrastructure + finalize prompt templates", status: "in_progress" as const, priority: "high" as const, due_date: "2025-07-31", assignee_id: null, created_at: new Date().toISOString() },
  { id: "ai2", meeting_id: "m1", title: "Priya to complete mobile app designs (iOS first)", description: "Focus on core meeting flow screens", status: "todo" as const, priority: "high" as const, due_date: "2025-07-15", assignee_id: null, created_at: new Date().toISOString() },
  { id: "ai3", meeting_id: "m1", title: "James to finalize Q3 OKR document", description: "Share with leadership for approval", status: "todo" as const, priority: "medium" as const, due_date: "2025-06-20", assignee_id: null, created_at: new Date().toISOString() },
  { id: "ai4", meeting_id: "m1", title: "Schedule weekly progress review meeting", description: "Recurring check-in on Q3 milestones", status: "done" as const, priority: "low" as const, due_date: "2025-06-14", assignee_id: null, created_at: new Date().toISOString() },
];

const DEMO_NOTES = {
  id: "n1",
  meeting_id: "m1",
  content: {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Q3 Planning Session — Meeting Notes" }] },
      { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Date:" }, { type: "text", text: " June 14, 2025  |  " }, { type: "text", marks: [{ type: "bold" }], text: "Attendees:" }, { type: "text", text: " Sarah, James, Priya, David" }] },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Q2 Highlights" }] },
      { type: "bulletList", content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Revenue target: 87% achieved" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "New search feature shipped on time ✅" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Onboarding conversion +12%" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "API response time -40%" }] }] },
      ]},
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Q3 Priorities" }] },
      { type: "orderedList", content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "AI Meeting Summaries" }, { type: "text", text: " — Beta by end of July 🤖" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Mobile App Launch" }, { type: "text", text: " — iOS first, Android Q4 📱" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Enterprise SSO Integration" }, { type: "text", text: " — For enterprise tier 🔐" }] }] },
      ]},
    ],
  },
  updated_by: "demo-user",
  updated_at: new Date().toISOString(),
};

const DEMO_USER = {
  id: "demo-user",
  email: "demo@meetflow.ai",
  full_name: "Demo User",
  preferred_summary_style: "concise",
};

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ── Demo Mode ─────────────────────────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return (
      <WorkspaceClient
        meeting={{ ...DEMO_MEETING, id }}
        initialAgenda={DEMO_AGENDA}
        initialNotes={DEMO_NOTES as any}
        initialTranscript={DEMO_TRANSCRIPT}
        initialActionItems={DEMO_ACTION_ITEMS}
        user={DEMO_USER}
      />
    );
  }

  // ── Real Mode ─────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, title, description, scheduled_at, duration_minutes, status, team_id")
    .eq("id", id)
    .single();

  if (!meeting) notFound();

  const { data: membership } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", meeting.team_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/meetings");

  const [agendaResult, notesResult, transcriptResult, actionItemsResult, profileResult] =
    await Promise.all([
      supabase.from("agenda_items").select("*").eq("meeting_id", id).order("position", { ascending: true }),
      supabase.from("notes").select("*").eq("meeting_id", id).single(),
      supabase.from("transcripts").select("*").eq("meeting_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("action_items").select("*").eq("meeting_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name, preferred_summary_style").eq("id", user.id).single(),
    ]);

  return (
    <WorkspaceClient
      meeting={meeting as any}
      initialAgenda={agendaResult.data ?? []}
      initialNotes={notesResult.data}
      initialTranscript={transcriptResult.data?.[0] ?? null}
      initialActionItems={actionItemsResult.data ?? []}
      user={{ id: user.id, email: user.email!, ...profileResult.data }}
    />
  );
}
