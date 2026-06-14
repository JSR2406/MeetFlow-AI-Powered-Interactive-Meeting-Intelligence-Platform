"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateMeetingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduled_at: z.string(),
  duration_minutes: z.coerce.number().min(5).max(480),
  participant_emails: z.array(z.string().email()).default([]),
  agenda_template: z.enum(["standup", "one_on_one", "planning", "retro", "custom"]).default("custom"),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;

const AGENDA_TEMPLATES: Record<string, { title: string; duration_minutes: number }[]> = {
  standup: [
    { title: "What did you do yesterday?", duration_minutes: 5 },
    { title: "What will you do today?", duration_minutes: 5 },
    { title: "Any blockers?", duration_minutes: 5 },
  ],
  one_on_one: [
    { title: "Check-in & personal updates", duration_minutes: 5 },
    { title: "Project status & priorities", duration_minutes: 15 },
    { title: "Career & growth discussion", duration_minutes: 10 },
    { title: "Feedback exchange", duration_minutes: 10 },
    { title: "Action items & next steps", duration_minutes: 5 },
  ],
  planning: [
    { title: "Sprint / Quarter goals", duration_minutes: 10 },
    { title: "Backlog review & prioritization", duration_minutes: 20 },
    { title: "Capacity planning", duration_minutes: 10 },
    { title: "Dependencies & risks", duration_minutes: 10 },
    { title: "Action items", duration_minutes: 10 },
  ],
  retro: [
    { title: "What went well?", duration_minutes: 15 },
    { title: "What could be improved?", duration_minutes: 15 },
    { title: "Action items for next sprint", duration_minutes: 15 },
  ],
  custom: [],
};

export async function createMeeting(input: CreateMeetingInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = CreateMeetingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return { error: "You must be part of a team to create meetings" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meeting, error: meetingError } = await (supabase.from("meetings") as any)
    .insert({
      team_id: membership.team_id,
      title: parsed.data.title,
      description: parsed.data.description,
      scheduled_at: parsed.data.scheduled_at,
      duration_minutes: parsed.data.duration_minutes,
      created_by: user.id,
      status: "scheduled",
    })
    .select()
    .single();

  if (meetingError) return { error: meetingError.message };

  const template = AGENDA_TEMPLATES[parsed.data.agenda_template] ?? [];
  if (template.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("agenda_items") as any).insert(
      template.map((item, i) => ({
        meeting_id: meeting.id,
        position: i,
        title: item.title,
        duration_minutes: item.duration_minutes,
      }))
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("meeting_participants") as any).insert({
    meeting_id: meeting.id,
    user_id: user.id,
    email: user.email!,
    status: "accepted",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("notes") as any).insert({
    meeting_id: meeting.id,
    content: { type: "doc", content: [] },
    updated_by: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/meetings");
  revalidatePath("/scheduler");

  return { data: meeting };
}

export async function updateMeetingStatus(
  meetingId: string,
  status: "scheduled" | "live" | "completed" | "cancelled"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("meetings") as any)
    .update({ status })
    .eq("id", meetingId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/meetings");
  return { success: true };
}

/**
 * Mock "Smart Suggest Times" — returns 3 fake slots.
 * TODO: integrate Google/Outlook Free-Busy API to get real availability.
 * See: https://developers.google.com/calendar/api/v3/reference/freebusy/query
 */
export async function suggestMeetingTimes(durationMinutes: number, _participantEmails: string[]) {
  // TODO: integrate Google/Outlook Free-Busy API
  // 1. Exchange OAuth token for each participant's calendar
  // 2. Call calendar.freebusy.query with timeMin/timeMax
  // 3. Find common free slots using interval merging
  // 4. Return top 3 suggestions

  const base = new Date();
  base.setHours(10, 0, 0, 0);

  const slots = [1, 2, 3].map((offset) => {
    const start = new Date(base);
    start.setDate(start.getDate() + offset);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: `Day ${offset} — ${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
      confidence: 0.9 - offset * 0.1,
    };
  });

  return { slots };
}
