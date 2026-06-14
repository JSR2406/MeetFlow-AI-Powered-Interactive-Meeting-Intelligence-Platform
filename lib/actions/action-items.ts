"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateActionItemStatus(
  itemId: string,
  status: "todo" | "in_progress" | "done"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("action_items") as any)
    .update({ status })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createActionItem(data: {
  meeting_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
  priority?: "low" | "medium" | "high";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item, error } = await (supabase.from("action_items") as any)
    .insert({ ...data, status: "todo" })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/planner");
  revalidatePath(`/meetings/${data.meeting_id}/workspace`);
  return { data: item };
}

export async function deleteActionItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("action_items") as any)
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { success: true };
}
