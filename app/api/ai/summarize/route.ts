import { generateObject } from "ai";
import { getModel } from "@/lib/ai/providers";
import { SummarySchema } from "@/lib/ai/schemas";
import { getSummarizePrompt } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId, content, style } = await request.json();
  if (!content) return NextResponse.json({ error: "No content provided" }, { status: 400 });

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: SummarySchema,
      prompt: getSummarizePrompt(content, style ?? "concise"),
    });

    // Write decisions to DB
    if (object.decisions && object.decisions.length > 0 && meetingId) {
      await supabase.from("decisions").insert(
        object.decisions.map((d) => ({
          meeting_id: meetingId,
          title: d.title,
          rationale: d.rationale ?? null,
        }))
      );
    }

    return NextResponse.json({ summary: object });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI summarization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
