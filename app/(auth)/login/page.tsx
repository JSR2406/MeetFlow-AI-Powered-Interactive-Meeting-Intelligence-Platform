"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, AlertTriangle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

function isSupabaseReady() {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return false;
    new URL(SUPABASE_URL);
    return SUPABASE_URL.startsWith("https://") &&
      (SUPABASE_KEY.startsWith("eyJ") || SUPABASE_KEY.startsWith("sb_"));
  } catch { return false; }
}

function SetupBanner() {
  return (
    <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-yellow-500 mb-1">Supabase not configured</p>
          <p className="text-muted-foreground">
            Add your credentials to <code className="text-brand">.env.local</code> to enable auth:
          </p>
          <pre className="mt-2 text-[10px] bg-muted p-2 rounded-lg overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...`}
          </pre>
          <p className="mt-1.5 text-muted-foreground">
            See <Link href="https://supabase.com/dashboard" target="_blank" className="text-brand hover:underline">supabase.com/dashboard</Link> → Project Settings → API.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabaseReady = isSupabaseReady();

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!supabaseReady) { toast.error("Configure Supabase first"); return; }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    if (!supabaseReady) { toast.error("Configure Supabase first"); return; }
    const email = getValues("email");
    if (!email) { toast.error("Please enter your email first"); return; }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabaseReady) { toast.error("Configure Supabase first"); return; }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-6">
          We sent a magic link to <strong>{getValues("email")}</strong>
        </p>
        <button onClick={() => setMagicLinkSent(false)} className="text-sm text-brand hover:underline">
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your MeetFlow workspace</p>
      </div>

      {!supabaseReady && <SetupBanner />}

      {/* Google OAuth */}
      <button
        onClick={signInWithGoogle}
        disabled={!supabaseReady}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-secondary transition-colors mb-6 text-sm font-medium disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-background px-2">or continue with email</span>
        </div>
      </div>

      {!isMagicLink ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
              />
            </div>
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
              />
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !supabaseReady}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <input
            type="email"
            placeholder="you@company.com"
            {...register("email")}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
          <button
            onClick={sendMagicLink}
            disabled={loading || !supabaseReady}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send magic link
          </button>
        </div>
      )}

      <button
        onClick={() => setIsMagicLink(!isMagicLink)}
        className="w-full mt-3 text-sm text-brand hover:underline"
      >
        {isMagicLink ? "Use password instead" : "Send magic link instead"}
      </button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  );
}
