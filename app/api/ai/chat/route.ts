import { streamText } from "ai";
import { getModel } from "@/lib/ai/providers";
import { getMeetingSystemPrompt } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, meetingId, meetingTitle, transcript, notesContent, preferredStyle } =
    await request.json();

  // Load user's preferred style from profile if not passed
  let style = preferredStyle;
  if (!style) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_summary_style")
      .eq("id", user.id)
      .single();
    style = profile?.preferred_summary_style ?? "concise";
  }

  const systemPrompt = getMeetingSystemPrompt({
    meetingTitle,
    notesContent: notesContent ? JSON.stringify(notesContent) : undefined,
    transcriptText: transcript,
    preferredStyle: style,
  });

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
    maxOutputTokens: 1024,
  });

  return result.toDataStreamResponse();
}
