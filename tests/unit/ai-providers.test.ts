import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the factory logic by directly invoking buildModel with mocked env vars.
// The AI SDK constructors are real but won't make network calls until text is generated.

describe("AI Provider Factory — getModel()", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset any cached model between tests
    vi.resetModules();
  });

  afterEach(() => {
    // Restore env
    process.env = { ...originalEnv };
  });

  it("builds an OpenAI model when AI_PROVIDER=openai", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test-key";

    const { getModel, resetModel } = await import("@/lib/ai/providers");
    resetModel();
    const model = getModel();
    expect(model).toBeDefined();
    expect(typeof model.modelId).toBe("string");
    expect(model.modelId).toContain("gpt");
  });

  it("builds an OpenRouter model when AI_PROVIDER=openrouter", async () => {
    process.env.AI_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
    process.env.OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";

    const { getModel, resetModel } = await import("@/lib/ai/providers");
    resetModel();
    const model = getModel();
    expect(model).toBeDefined();
    expect(model.modelId).toBe("anthropic/claude-3.5-sonnet");
  });

  it("builds a Groq model when AI_PROVIDER=groq", async () => {
    process.env.AI_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "gsk_test";
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile";

    const { getModel, resetModel } = await import("@/lib/ai/providers");
    resetModel();
    const model = getModel();
    expect(model).toBeDefined();
    expect(model.modelId).toContain("llama");
  });

  it("returns the same model instance on repeated calls (singleton)", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";

    const { getModel, resetModel } = await import("@/lib/ai/providers");
    resetModel();
    const m1 = getModel();
    const m2 = getModel();
    expect(m1).toBe(m2);
  });

  it("uses custom OPENROUTER_MODEL env var", async () => {
    process.env.AI_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
    process.env.OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

    const { getModel, resetModel } = await import("@/lib/ai/providers");
    resetModel();
    const model = getModel();
    expect(model.modelId).toBe("google/gemini-2.0-flash-001");
  });

  it("falls back to openai when AI_PROVIDER is unset", async () => {
    delete process.env.AI_PROVIDER;
    process.env.OPENAI_API_KEY = "sk-test";

    const { getModel, resetModel } = await import("@/lib/ai/providers");
    resetModel();
    const model = getModel();
    expect(model.modelId).toContain("gpt");
  });
});
