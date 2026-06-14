import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/auth/confirm",
  "/onboarding",
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Returns true only when Supabase env vars look valid */
function hasValidSupabaseConfig(): boolean {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return false;
    // Validate URL is a real HTTPS URL
    const url = new URL(SUPABASE_URL);
    if (!url.protocol.startsWith("https")) return false;
    // Accept both legacy JWT anon keys (eyJ...) and new publishable keys (sb_...)
    if (!SUPABASE_KEY.startsWith("eyJ") && !SUPABASE_KEY.startsWith("sb_")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If Supabase is not yet configured, allow all requests through so the
  // app still renders. The individual pages will show appropriate empty states.
  if (!hasValidSupabaseConfig()) {
    return NextResponse.next({ request });
  }

  // Allow public paths without session refresh
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const { supabaseResponse, user } = await updateSession(request);

  // Protect (app) routes — redirect to login if not authenticated
  if (!isPublic && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
