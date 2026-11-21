# MeetFlow

A full-stack meeting workspace built with Next.js, TypeScript, and Supabase. Organize meetings, keep notes and plans together, and use AI-assisted summaries and action-item extraction when an AI provider is configured.

## Repository layout

| Path | Responsibility |
| --- | --- |
| [Meeting workspaces](app/%28app%29/meetings) | Meeting list and individual workspace views |
| [Notes](app/%28app%29/notes) and [planner](app/%28app%29/planner) | Notes and task planning |
| [AI routes](app/api/ai) | Summarize, extract, suggest, and chat endpoints |
| [Supabase migration](supabase/migrations/0001_init.sql) | Initial database schema |
| [tests](tests) | Vitest unit and integration suites |

## Run locally

Install Node.js and pnpm, configure a development Supabase project, and apply the [initial migration](supabase/migrations/0001_init.sql). Copy [`.env.example`](.env.example) to `.env.local` and set the Supabase URL and keys. Choose the AI provider and supply its server-side key to use the AI routes. Keep service-role and provider keys out of browser code and version control.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Run `pnpm typecheck` and `pnpm test` from the repository root to check the code. Use sample meeting content to try the AI features.
