/**
 * Quick OpenRouter smoke test — run directly with:
 *   npx tsx scripts/test-openrouter.ts
 *
 * Does NOT require Supabase. Just tests the OpenRouter API key and model.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!API_KEY || API_KEY === "your_openrouter_api_key") {
  console.error("❌ OPENROUTER_API_KEY not set in .env.local");
  process.exit(1);
}

async function run() {
  console.log(`🔍 Testing OpenRouter with model: ${MODEL}\n`);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": APP_URL,
      "X-Title": "MeetFlow AI",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are MeetFlow AI, an intelligent meeting co-pilot.",
        },
        {
          role: "user",
          content:
            "Summarize this meeting in one sentence: Alice and Bob discussed the Q3 roadmap and decided to prioritize the API integration.",
        },
      ],
      max_tokens: 100,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ OpenRouter returned ${res.status}:\n${err}`);
    process.exit(1);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? "(no response)";

  console.log("✅ OpenRouter responded successfully!\n");
  console.log(`Model:    ${data.model}`);
  console.log(`Usage:    ${JSON.stringify(data.usage)}`);
  console.log(`Response: ${reply}\n`);

  // Check credit balance
  const creditsRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (creditsRes.ok) {
    const creds = await creditsRes.json();
    console.log(`💳 Credits remaining: $${creds.data?.limit_remaining?.toFixed(4) ?? "N/A"}`);
    console.log(`   Rate limit: ${creds.data?.rate_limit?.requests ?? "N/A"} req/min`);
  }
}

run().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
