import { describe, it, expect } from "vitest";
import { z } from "zod";
import { SummarySchema, ActionItemsSchema, SuggestedPlanSchema } from "@/lib/ai/schemas";

describe("SummarySchema", () => {
  it("validates a correct summary object", () => {
    const valid = {
      tl_dr: "A quick sync on Q3 priorities.",
      key_points: ["Decided on feature set", "Assigned owners"],
      decisions: [{ title: "Ship in Q3", rationale: "Market timing" }],
      risks: ["Budget may overrun"],
      sentiment: 0.8,
    };
    expect(() => SummarySchema.parse(valid)).not.toThrow();
  });

  it("accepts missing optional fields (decisions rationale, sentiment in range)", () => {
    const minimal = {
      tl_dr: "Short meeting.",
      key_points: [],
      decisions: [],
      risks: [],
      sentiment: 0,
    };
    expect(() => SummarySchema.parse(minimal)).not.toThrow();
  });

  it("rejects missing tl_dr field", () => {
    expect(() =>
      SummarySchema.parse({ key_points: [], decisions: [], risks: [], sentiment: 0 })
    ).toThrow(z.ZodError);
  });

  it("rejects sentiment outside -1..1 range", () => {
    const bad = {
      tl_dr: "Meeting.",
      key_points: [],
      decisions: [],
      risks: [],
      sentiment: 2, // out of range
    };
    expect(() => SummarySchema.parse(bad)).toThrow(z.ZodError);
  });

  it("enforces sentiment is a number, not a string", () => {
    const bad = {
      tl_dr: "Meeting.",
      key_points: [],
      decisions: [],
      risks: [],
      sentiment: "positive", // wrong type
    };
    expect(() => SummarySchema.parse(bad)).toThrow(z.ZodError);
  });
});

describe("ActionItemsSchema", () => {
  it("validates a list of action items", () => {
    const valid = {
      items: [
        { title: "Fix the bug", priority: "high", due_date: "2024-07-01", assignee_email: "alice@example.com" },
        { title: "Write docs", priority: "low" },
      ],
    };
    expect(() => ActionItemsSchema.parse(valid)).not.toThrow();
  });

  it("accepts items with no due_date or assignee", () => {
    const valid = { items: [{ title: "General task", priority: "medium" }] };
    expect(() => ActionItemsSchema.parse(valid)).not.toThrow();
  });

  it("defaults priority to medium when omitted", () => {
    const result = ActionItemsSchema.parse({ items: [{ title: "Task" }] });
    expect(result.items[0].priority).toBe("medium");
  });

  it("rejects invalid priority value", () => {
    const bad = { items: [{ title: "Task", priority: "urgent" }] };
    expect(() => ActionItemsSchema.parse(bad)).toThrow(z.ZodError);
  });

  it("accepts empty items array", () => {
    expect(() => ActionItemsSchema.parse({ items: [] })).not.toThrow();
  });
});

describe("SuggestedPlanSchema", () => {
  it("validates a suggested plan with string arrays", () => {
    const valid = {
      next_steps: ["Schedule follow-up with Alice", "Update Jira board"],
      risks: ["Budget overrun if delayed", "Key person dependency on Bob"],
      alternatives: ["Delay launch by 2 weeks", "Reduce scope for Q3"],
    };
    expect(() => SuggestedPlanSchema.parse(valid)).not.toThrow();
  });

  it("accepts empty arrays", () => {
    const minimal = { next_steps: [], risks: [], alternatives: [] };
    expect(() => SuggestedPlanSchema.parse(minimal)).not.toThrow();
  });

  it("accepts optional timeline_suggestion", () => {
    const withTimeline = {
      next_steps: [],
      risks: [],
      alternatives: [],
      timeline_suggestion: "Complete by end of Q3",
    };
    expect(() => SuggestedPlanSchema.parse(withTimeline)).not.toThrow();
  });

  it("rejects object items in string arrays", () => {
    const bad = {
      next_steps: [{ action: "Do something" }], // should be string
      risks: [],
      alternatives: [],
    };
    expect(() => SuggestedPlanSchema.parse(bad)).toThrow(z.ZodError);
  });
});
