import { describe, it, expect } from "vitest";
import { getMeetingSystemPrompt, getSummarizePrompt, getExtractPrompt } from "@/lib/ai/prompts";

describe("getMeetingSystemPrompt", () => {
  it("includes the meeting title in the prompt", () => {
    const prompt = getMeetingSystemPrompt({ meetingTitle: "Q3 Planning" });
    expect(prompt).toContain("Q3 Planning");
  });

  it("includes transcript when provided", () => {
    const prompt = getMeetingSystemPrompt({
      meetingTitle: "Test",
      transcriptText: "Alice: Let's start.",
    });
    expect(prompt).toContain("Alice: Let's start.");
  });

  it("includes preferred style", () => {
    const prompt = getMeetingSystemPrompt({
      meetingTitle: "Test",
      preferredStyle: "executive",
    });
    expect(prompt.toLowerCase()).toContain("executive");
  });

  it("works with no optional fields", () => {
    expect(() => getMeetingSystemPrompt({ meetingTitle: "Minimal" })).not.toThrow();
  });
});

describe("getSummarizePrompt", () => {
  it("includes the content to summarize", () => {
    const prompt = getSummarizePrompt("Discussed Q3 goals", "concise");
    expect(prompt).toContain("Discussed Q3 goals");
  });

  it("mentions the summary style", () => {
    const prompt = getSummarizePrompt("Content", "detailed");
    expect(prompt.toLowerCase()).toContain("detailed");
  });

  it("returns a non-empty string", () => {
    expect(getSummarizePrompt("Any content", "concise").length).toBeGreaterThan(20);
  });
});

describe("getExtractPrompt", () => {
  it("includes the content to extract from", () => {
    const prompt = getExtractPrompt("Bob will fix the bug by Friday");
    expect(prompt).toContain("Bob will fix the bug by Friday");
  });

  it("instructs to extract action items", () => {
    const prompt = getExtractPrompt("Content");
    expect(prompt.toLowerCase()).toContain("action item");
  });
});
