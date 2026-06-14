import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlannerClient } from "@/components/planner/planner-client";

export const metadata = { title: "Planner" };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
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
