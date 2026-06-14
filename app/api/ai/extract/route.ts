import { generateObject } from "ai";
import { getModel } from "@/lib/ai/providers";
import { ActionItemsSchema } from "@/lib/ai/schemas";
import { getExtractPrompt } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId, content } = await request.json();
  if (!content) return NextResponse.json({ error: "No content provided" }, { status: 400 });

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: ActionItemsSchema,
      prompt: getExtractPrompt(content),
    });

    const inserted = [];
    for (const item of object.items) {
      // Try to match assignee by email
      let assigneeId: string | null = null;
      if (item.assignee_email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", (
            await supabase.auth.admin
              .listUsers()
              .then((r) => r.data.users.find((u) => u.email === item.assignee_email)?.id ?? "")
          ).toString())
          .single();
        assigneeId = profile?.id ?? null;
      }

      const { data, error } = await supabase
        .from("action_items")
        .insert({
          meeting_id: meetingId,
          title: item.title,
          description: item.description ?? null,
          assignee_id: assigneeId,
          due_date: item.due_date ?? null,
          priority: item.priority ?? "medium",
          status: "todo",
        })
        .select()
        .single();

      if (!error && data) inserted.push(data);
    }

    return NextResponse.json({ items: inserted, extracted: object.items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
