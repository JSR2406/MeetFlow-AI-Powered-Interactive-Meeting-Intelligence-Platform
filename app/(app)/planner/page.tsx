import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlannerClient } from "@/components/planner/planner-client";

export const metadata = { title: "Planner" };

// Demo data for when NEXT_PUBLIC_DEMO_MODE=true
const DEMO_ACTION_ITEMS = [
  { id: "d1", meeting_id: "m1", title: "Finalize Q3 product roadmap and share with leadership", description: "Include revenue projections and headcount needs", status: "todo" as const, priority: "high" as const, due_date: "2025-06-20", assignee_id: null, created_at: new Date().toISOString() },
  { id: "d2", meeting_id: "m1", title: "Update API documentation for v2.0 endpoints", description: null, status: "todo" as const, priority: "medium" as const, due_date: "2025-06-18", assignee_id: null, created_at: new Date().toISOString() },
  { id: "d3", meeting_id: "m2", title: "Schedule follow-up interviews for engineering candidates", description: "3 candidates from last week pipeline", status: "todo" as const, priority: "high" as const, due_date: "2025-06-16", assignee_id: null, created_at: new Date().toISOString() },
  { id: "d4", meeting_id: "m2", title: "Review and merge open PRs from sprint 24", description: "6 PRs waiting review", status: "in_progress" as const, priority: "high" as const, due_date: "2025-06-15", assignee_id: null, created_at: new Date().toISOString() },
  { id: "d5", meeting_id: "m3", title: "Implement search indexing for meeting transcripts", description: null, status: "in_progress" as const, priority: "medium" as const, due_date: "2025-06-22", assignee_id: null, created_at: new Date().toISOString() },
  { id: "d6", meeting_id: "m3", title: "Set up production monitoring alerts", description: "PagerDuty integration", status: "in_progress" as const, priority: "high" as const, due_date: "2025-06-17", assignee_id: null, created_at: new Date().toISOString() },
  { id: "d7", meeting_id: "m1", title: "Send sprint retrospective summary email", description: null, status: "done" as const, priority: "low" as const, due_date: "2025-06-13", assignee_id: null, created_at: new Date().toISOString() },
  { id: "d8", meeting_id: "m2", title: "Create onboarding checklist for new engineers", description: null, status: "done" as const, priority: "medium" as const, due_date: "2025-06-12", assignee_id: null, created_at: new Date().toISOString() },
];

const DEMO_MEETINGS = [
  { id: "m1", title: "Q3 Planning Session", scheduled_at: new Date().toISOString(), status: "completed" as const },
  { id: "m2", title: "Engineering Standup", scheduled_at: new Date().toISOString(), status: "completed" as const },
  { id: "m3", title: "Design Review", scheduled_at: new Date().toISOString(), status: "scheduled" as const },
];

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return (
      <PlannerClient
        initialActionItems={DEMO_ACTION_ITEMS}
        meetings={DEMO_MEETINGS}
        defaultTab={params.tab ?? "kanban"}
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's teams
  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = teamMemberships?.map((t) => t.team_id) ?? [];

  // Get meetings for those teams (needed for meeting_id join)
  const { data: meetings } = teamIds.length
    ? await supabase
        .from("meetings")
        .select("id")
        .in("team_id", teamIds)
    : { data: [] };

  const meetingIds = meetings?.map((m) => m.id) ?? [];

  const [actionItemsResult, meetingsForChart] = await Promise.all([
    meetingIds.length
      ? supabase
          .from("action_items")
          .select("id, title, description, status, priority, due_date, assignee_id, meeting_id, created_at")
          .in("meeting_id", meetingIds)
          .order("created_at", { ascending: false })
      : { data: [] },
    teamIds.length
      ? supabase
          .from("meetings")
          .select("id, title, scheduled_at, status")
          .in("team_id", teamIds)
          .order("scheduled_at", { ascending: false })
          .limit(20)
      : { data: [] },
  ]);

  return (
    <PlannerClient
      initialActionItems={actionItemsResult.data ?? []}
      meetings={meetingsForChart.data ?? []}
      defaultTab={params.tab ?? "kanban"}
    />
  );
}
