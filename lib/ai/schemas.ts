import { z } from "zod";

export const SummarySchema = z.object({
  tl_dr: z.string().describe("A one-paragraph executive summary of the meeting"),
  key_points: z.array(z.string()).describe("Bullet list of the most important discussion points"),
  decisions: z.array(
    z.object({
      title: z.string(),
      rationale: z.string().optional(),
    })
  ).describe("Decisions made during the meeting"),
  risks: z.array(z.string()).describe("Risks or blockers identified"),
  sentiment: z.number().min(-1).max(1).describe("Overall sentiment score from -1 (negative) to 1 (positive)"),
});

export type Summary = z.infer<typeof SummarySchema>;

export const ActionItemsSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().describe("Short action item title"),
      description: z.string().optional().describe("Detailed description if needed"),
      assignee_email: z.string().email().optional().describe("Assignee email if mentioned"),
      due_date: z.string().optional().describe("Due date in ISO format (YYYY-MM-DD) if mentioned"),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
    })
  ).describe("List of action items extracted from the transcript or notes"),
});

export type ActionItems = z.infer<typeof ActionItemsSchema>;

export const SuggestedPlanSchema = z.object({
  next_steps: z.array(z.string()).describe("Recommended next steps for the team"),
  risks: z.array(z.string()).describe("Potential risks to watch out for"),
  alternatives: z.array(z.string()).describe("Alternative approaches considered"),
  timeline_suggestion: z.string().optional().describe("Suggested timeline for next steps"),
});

export type SuggestedPlan = z.infer<typeof SuggestedPlanSchema>;

export const SentimentSchema = z.object({
  overall: z.number().min(-1).max(1),
  segments: z.array(
    z.object({
      text: z.string(),
      score: z.number().min(-1).max(1),
    })
  ),
});

export type Sentiment = z.infer<typeof SentimentSchema>;
