import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SchedulerClient } from "@/components/scheduler/scheduler-client";

export const metadata = { title: "Scheduler" };

export default async function SchedulerPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
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

  const { data: meetings } = teamIds.length
    ? await supabase
        .from("meetings")
        .select("id, title, scheduled_at, duration_minutes, status")
        .in("team_id", teamIds)
        .order("scheduled_at", { ascending: true })
    : { data: [] };

  return (
    <SchedulerClient
      meetings={meetings ?? []}
      openNewMeeting={params.new === "1"}
    />
  );
}
