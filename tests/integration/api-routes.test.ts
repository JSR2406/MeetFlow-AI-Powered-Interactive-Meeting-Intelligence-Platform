/**
 * API Route Tests for /api/ai/*
 *
 * These are integration tests that mock the AI SDK and Supabase,
 * then call the route handlers directly (no HTTP server needed).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@test.com" },
        },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { preferred_summary_style: "concise" },
        error: null,
      }),
    }),
  }),
}));

vi.mock("@/lib/ai/providers", () => ({
  getModel: vi.fn().mockReturnValue({ modelId: "mock-model" }),
}));

vi.mock("ai", () => ({
  streamText: vi.fn().mockReturnValue({
    toDataStreamResponse: vi.fn().mockReturnValue(
      new Response("data: mock stream\n\n", {
        headers: { "Content-Type": "text/event-stream" },
      })
    ),
  }),
  generateObject: vi.fn().mockResolvedValue({
    object: {
      tldr: "Test summary",
      key_points: ["Point 1"],
      action_items: [{ title: "Task 1", priority: "medium" }],
      decisions: [],
      sentiment: "positive",
    },
  }),
}));

// ── /api/ai/chat ─────────────────────────────────────────────────────────────

describe("POST /api/ai/chat", () => {
  it("returns a streaming response for authenticated users", async () => {
    const { POST } = await import("@/app/api/ai/chat/route");

    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Summarize this meeting" }],
        meetingId: "meeting-123",
        meetingTitle: "Test Meeting",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 401 for unauthenticated requests", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(),
    } as never);

    const { POST } = await import("@/app/api/ai/chat/route");

    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

// ── /api/ai/summarize ────────────────────────────────────────────────────────

describe("POST /api/ai/summarize", () => {
  it("returns a structured summary object", async () => {
    const { POST } = await import("@/app/api/ai/summarize/route");

    const req = new NextRequest("http://localhost:3000/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({
        meetingId: "meeting-123",
        content: "Alice: We discussed Q3. Bob: Agreed on timeline.",
        style: "concise",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.summary).toBeDefined();
    expect(json.summary.tldr).toBe("Test summary");
  });

  it("returns 400 when content is missing", async () => {
    const { POST } = await import("@/app/api/ai/summarize/route");

    const req = new NextRequest("http://localhost:3000/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ meetingId: "meeting-123" }), // no content
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
