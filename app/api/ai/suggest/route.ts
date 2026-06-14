import { generateObject } from "ai";
import { getModel } from "@/lib/ai/providers";
import { SuggestedPlanSchema } from "@/lib/ai/schemas";
import { getSuggestPrompt } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await request.json();
  if (!content) return NextResponse.json({ error: "No content provided" }, { status: 400 });

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: SuggestedPlanSchema,
      prompt: getSuggestPrompt(content),
    });

    return NextResponse.json({ plan: object });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Planning failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
