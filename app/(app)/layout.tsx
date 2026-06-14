import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Check if Supabase is configured
  let user = null;
  let profile = null;

  try {
    new URL(supabaseUrl); // validate URL
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
  } catch {
    // Supabase not configured — redirect to login for setup
    redirect("/login");
  }

  const userInfo = {
    full_name: profile?.full_name ?? null,
    email: user?.email,
    avatar_url: profile?.avatar_url ?? null,
  };

  return <AppShell user={userInfo}>{children}</AppShell>;
}
