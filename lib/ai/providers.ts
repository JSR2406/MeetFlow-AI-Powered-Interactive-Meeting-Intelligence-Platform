/**
 * AI Provider Factory
 *
 * Supports: openai | groq | openrouter
 * Set AI_PROVIDER in .env.local to switch — no code changes needed.
 *
 * OpenRouter gives access to 200+ models (Claude, Gemini, Llama, Mistral, etc.)
 * via a single OpenAI-compatible API. Set:
 *   AI_PROVIDER=openrouter
 *   OPENROUTER_API_KEY=sk-or-v1-...
 *   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet   (optional, see defaults below)
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

type Provider = "openai" | "groq" | "openrouter";

const PROVIDER = (process.env.AI_PROVIDER ?? "openai") as Provider;

/** Default model per provider */
const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  // Claude Sonnet 4 — best quality/cost for meeting intelligence on this account
  openrouter: "anthropic/claude-sonnet-4",
};

function buildModel(): LanguageModel {
  switch (PROVIDER) {
    case "groq": {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
      const model = process.env.GROQ_MODEL ?? DEFAULT_MODELS.groq;
      return groq(model);
    }

    case "openrouter": {
      // OpenRouter is OpenAI-compatible — use @ai-sdk/openai with custom baseURL
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        // OpenRouter recommends including these headers for usage tracking
        headers: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "MeetFlow AI",
        },
      });
      const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODELS.openrouter;
      return openrouter(model);
    }

    case "openai":
    default: {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_MODEL ?? DEFAULT_MODELS.openai;
      return openai(model);
    }
  }
}

/** Singleton model instance — built once per server process */
let _model: LanguageModel | null = null;

export function getModel(): LanguageModel {
  if (!_model) _model = buildModel();
  return _model;
}

/** Reset the cached model (useful in tests) */
export function resetModel(): void {
  _model = null;
}

export { PROVIDER, DEFAULT_MODELS };
