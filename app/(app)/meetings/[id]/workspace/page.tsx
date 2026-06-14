import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { WorkspaceClient } from "@/components/meetings/workspace-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("meetings").select("title").eq("id", id).single();
  return { title: data?.title ?? "Workspace" };
}

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, title, description, scheduled_at, duration_minutes, status, team_id")
    .eq("id", id)
    .single();

  if (!meeting) notFound();

  // Verify access
  const { data: membership } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", meeting.team_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/meetings");

  const [agendaResult, notesResult, transcriptResult, actionItemsResult, profileResult] =
    await Promise.all([
      supabase
        .from("agenda_items")
        .select("*")
        .eq("meeting_id", id)
        .order("position", { ascending: true }),
      supabase.from("notes").select("*").eq("meeting_id", id).single(),
      supabase.from("transcripts").select("*").eq("meeting_id", id).order("created_at", { ascending: false }).limit(1),
      supabase
        .from("action_items")
        .select("*")
        .eq("meeting_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name, preferred_summary_style").eq("id", user.id).single(),
    ]);

  return (
    <WorkspaceClient
      meeting={meeting}
      initialAgenda={agendaResult.data ?? []}
      initialNotes={notesResult.data}
      initialTranscript={transcriptResult.data?.[0] ?? null}
      initialActionItems={actionItemsResult.data ?? []}
      user={{ id: user.id, email: user.email!, ...profileResult.data }}
    />
  );
}
