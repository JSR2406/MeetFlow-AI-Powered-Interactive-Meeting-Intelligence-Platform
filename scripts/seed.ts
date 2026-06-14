/**
 * MeetFlow Demo Data Seed Script
 * Run: pnpm seed
 *
 * Prerequisites:
 * - SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 * - Database migration already run
 *
 * This script is idempotent — safe to run multiple times.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱 Seeding MeetFlow demo data…");

  // ------------------------------------------------------------------
  // 1. Create demo users via admin API
  // ------------------------------------------------------------------
  const demo1Email = "alice@meetflow.demo";
  const demo2Email = "bob@meetflow.demo";

  let alice = (await supabase.auth.admin.listUsers()).data.users.find(
    (u) => u.email === demo1Email
  );
  if (!alice) {
    const { data } = await supabase.auth.admin.createUser({
      email: demo1Email,
      password: "meetflow123!",
      email_confirm: true,
      user_metadata: { full_name: "Alice Chen" },
    });
    alice = data.user!;
    console.log("✅ Created user: alice@meetflow.demo");
  } else {
    console.log("⏭️  User alice already exists");
  }

  let bob = (await supabase.auth.admin.listUsers()).data.users.find(
    (u) => u.email === demo2Email
  );
  if (!bob) {
    const { data } = await supabase.auth.admin.createUser({
      email: demo2Email,
      password: "meetflow123!",
      email_confirm: true,
      user_metadata: { full_name: "Bob Rodriguez" },
    });
    bob = data.user!;
    console.log("✅ Created user: bob@meetflow.demo");
  } else {
    console.log("⏭️  User bob already exists");
  }

  const aliceId = alice!.id;
  const bobId = bob!.id;

  // ------------------------------------------------------------------
  // 2. Upsert profiles
  // ------------------------------------------------------------------
  await supabase.from("profiles").upsert([
    { id: aliceId, full_name: "Alice Chen", role: "Engineering Manager", company: "Acme Corp", preferred_summary_style: "executive" },
    { id: bobId, full_name: "Bob Rodriguez", role: "Product Manager", company: "Acme Corp", preferred_summary_style: "concise" },
  ]);
  console.log("✅ Profiles upserted");

  // ------------------------------------------------------------------
  // 3. Create a demo team
  // ------------------------------------------------------------------
  let teamId: string;
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("name", "Acme Engineering")
    .single();

  if (existingTeam) {
    teamId = existingTeam.id;
    console.log("⏭️  Team already exists");
  } else {
    const { data: team } = await supabase
      .from("teams")
      .insert({ name: "Acme Engineering", owner_id: aliceId })
      .select()
      .single();
    teamId = team!.id;

    await supabase.from("team_members").insert([
      { team_id: teamId, user_id: aliceId, role: "owner" },
      { team_id: teamId, user_id: bobId, role: "member" },
    ]);
    console.log("✅ Team created");
  }

  // ------------------------------------------------------------------
  // 4. Create meetings
  // ------------------------------------------------------------------
  const now = new Date();
  const past = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
  const future = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000).toISOString();

  const meetingsData = [
    {
      title: "Q3 Product Planning",
      description: "Align on Q3 priorities and roadmap",
      scheduled_at: past(14),
      duration_minutes: 90,
      status: "completed" as const,
    },
    {
      title: "Engineering Retrospective",
      description: "Sprint 24 retrospective",
      scheduled_at: past(7),
      duration_minutes: 60,
      status: "completed" as const,
    },
    {
      title: "Weekly Standup",
      description: "Team sync",
      scheduled_at: past(3),
      duration_minutes: 15,
      status: "completed" as const,
    },
    {
      title: "Hiring Panel Review",
      description: "Review senior engineer candidates",
      scheduled_at: past(1),
      duration_minutes: 45,
      status: "completed" as const,
    },
    {
      title: "Budget Review",
      description: "Q4 budget planning with Finance",
      scheduled_at: past(2),
      duration_minutes: 60,
      status: "cancelled" as const,
    },
    {
      title: "Weekly Standup",
      description: "Monday standup",
      scheduled_at: future(1),
      duration_minutes: 15,
      status: "scheduled" as const,
    },
    {
      title: "Product Demo — External",
      description: "Demo new features to stakeholders",
      scheduled_at: future(3),
      duration_minutes: 60,
      status: "scheduled" as const,
    },
    {
      title: "1:1 Alice & Bob",
      description: "Monthly 1:1",
      scheduled_at: future(5),
      duration_minutes: 30,
      status: "scheduled" as const,
    },
  ];

  for (const m of meetingsData) {
    // Check if already exists
    const { data: existing } = await supabase
      .from("meetings")
      .select("id")
      .eq("title", m.title)
      .eq("scheduled_at", m.scheduled_at)
      .single();

    if (existing) continue;

    const { data: meeting } = await supabase
      .from("meetings")
      .insert({ ...m, team_id: teamId, created_by: aliceId })
      .select()
      .single();

    if (!meeting) continue;

    // Participants
    await supabase.from("meeting_participants").insert([
      { meeting_id: meeting.id, user_id: aliceId, email: demo1Email, status: "accepted" },
      { meeting_id: meeting.id, user_id: bobId, email: demo2Email, status: "accepted" },
    ]);

    // Notes + transcript for completed meetings
    if (m.status === "completed") {
      await supabase.from("notes").insert({
        meeting_id: meeting.id,
        content: {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: m.title }] },
            { type: "paragraph", content: [{ type: "text", text: "Key discussion points covered in today's session. Team aligned on priorities." }] },
            { type: "bulletList", content: [
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Reviewed Q3 OKRs — on track" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Identified blockers: API rate limits, design handoff delay" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Agreed to increase sprint velocity target" }] }] },
            ] },
          ],
        },
        updated_by: aliceId,
      });

      await supabase.from("transcripts").insert({
        meeting_id: meeting.id,
        raw_text: `Alice: Let's start with a quick review of our Q3 progress. We're at 65% completion on our key features.\n\nBob: The main blocker right now is the API rate limits from our third-party vendor. We've raised a ticket but haven't heard back.\n\nAlice: That's concerning. Let's escalate. Bob, can you own that and follow up by end of week?\n\nBob: Sure, I'll send a priority escalation email today.\n\nAlice: Great. Also, design handoff has been delayed. Sarah mentioned the Figma files won't be ready until next Thursday.\n\nBob: That impacts at least 3 stories in the current sprint. We should move them to next sprint.\n\nAlice: Agreed. Let's update the board. Any other blockers?\n\nBob: Nothing else from my side. Team morale is good.\n\nAlice: Excellent. Final decision: we're increasing our sprint velocity target from 40 to 50 story points starting next sprint. Everyone aligned?\n\nBob: Sounds good to me.\n\nAlice: Perfect. That's a wrap.`,
        language: "en",
      });

      // Action items
      await supabase.from("action_items").insert([
        {
          meeting_id: meeting.id,
          title: "Escalate API rate limit issue to vendor",
          description: "Send priority escalation email to vendor support",
          assignee_id: bobId,
          due_date: new Date(now.getTime() + 2 * 86400000).toISOString().split("T")[0],
          status: "in_progress",
          priority: "high",
        },
        {
          meeting_id: meeting.id,
          title: "Move blocked stories to next sprint",
          description: "Update Jira board with 3 stories affected by design delay",
          assignee_id: aliceId,
          due_date: new Date(now.getTime() + 1 * 86400000).toISOString().split("T")[0],
          status: "todo",
          priority: "medium",
        },
        {
          meeting_id: meeting.id,
          title: "Update sprint velocity target in team docs",
          assignee_id: aliceId,
          status: "done",
          priority: "low",
        },
      ]);

      // Decisions
      await supabase.from("decisions").insert([
        {
          meeting_id: meeting.id,
          title: "Increase sprint velocity target to 50 points",
          rationale: "Team has capacity and wants to increase throughput",
        },
      ]);
    }

    // Agenda for all
    await supabase.from("agenda_items").insert([
      { meeting_id: meeting.id, position: 0, title: "Progress review", duration_minutes: 15 },
      { meeting_id: meeting.id, position: 1, title: "Blockers & risks", duration_minutes: 10 },
      { meeting_id: meeting.id, position: 2, title: "Decisions & next steps", duration_minutes: 10 },
    ]);

    console.log(`✅ Created meeting: ${m.title}`);
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("Demo users:");
  console.log("  📧 alice@meetflow.demo / meetflow123!");
  console.log("  📧 bob@meetflow.demo / meetflow123!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
