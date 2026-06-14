import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── Next.js mocks ────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// next/image — render as plain <img> without JSX in setup file
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { createElement } = require("react");
    const { src, alt, width, height, ...rest } = props;
    return createElement("img", { src, alt, width, height, ...rest });
  },
}));

// ── Supabase client mock ─────────────────────────────────────────────────────

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue({}),
  }),
  removeChannel: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// ── Toast mock ────────────────────────────────────────────────────────────────

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

// ── Console error filter ──────────────────────────────────────────────────────
// Suppress expected React/Vitest warnings in test output

const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("Warning:") ||
      msg.includes("act(") ||
      msg.includes("ReactDOM.render") ||
      msg.includes("not wrapped in act")
    )
      return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
