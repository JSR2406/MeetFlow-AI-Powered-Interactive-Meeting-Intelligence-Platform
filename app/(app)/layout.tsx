import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Demo mode — render with a guest identity, no redirect
  if (isDemoMode) {
    const guestUser = {
      full_name: "Demo User",
      email: "demo@meetflow.ai",
      avatar_url: null,
    };
    return <AppShell user={guestUser}>{children}</AppShell>;
  }

  let user = null;
  let profile = null;

  try {
    new URL(supabaseUrl); // validate URL — throws if invalid/missing
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/login");

    user = authUser;
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", authUser.id)
      .single();
    profile = profileData;
  } catch (err) {
    // If it's a redirect, re-throw it
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    // Supabase not configured — redirect to login
    redirect("/login");
  }

  const userInfo = {
    full_name: profile?.full_name ?? null,
    email: user?.email,
    avatar_url: profile?.avatar_url ?? null,
  };

  return <AppShell user={userInfo}>{children}</AppShell>;
}
