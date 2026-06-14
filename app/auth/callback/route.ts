import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this user has a profile (i.e. has completed onboarding)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .single();

      // New OAuth user with no profile → send to onboarding
      // (profile row may be created by DB trigger, but full_name may still be null)
      if (!profile?.full_name) {
        // Pre-populate full_name from OAuth provider metadata if available
        const fullName = data.user.user_metadata?.full_name
          ?? data.user.user_metadata?.name
          ?? null;

        if (fullName) {
          await supabase
            .from("profiles")
            .upsert({ id: data.user.id, full_name: fullName });
        }

        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed&message=Could+not+authenticate+user`
  );
}
