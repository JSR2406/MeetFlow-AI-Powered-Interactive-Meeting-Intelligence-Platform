"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  preferredSummaryStyle: z.enum(["concise", "detailed", "executive", "technical"]),
});

type FormData = z.infer<typeof schema>;

const summaryStyles = [
  { value: "concise", label: "Concise", desc: "Short bullet points, key info only" },
  { value: "detailed", label: "Detailed", desc: "Thorough with context and reasoning" },
  { value: "executive", label: "Executive", desc: "Business impact and decisions focused" },
  { value: "technical", label: "Technical", desc: "Implementation details included" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferredSummaryStyle: "concise" },
  });

  const selectedStyle = watch("preferredSummaryStyle");

  // Pre-populate from Google/OAuth metadata on mount
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata;
      if (meta?.full_name) setValue("fullName", meta.full_name);
      else if (meta?.name) setValue("fullName", meta.name);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("profiles") as any).upsert({
        id: user.id,
        full_name: data.fullName,
        role: data.role,
        company: data.company,
        preferred_summary_style: data.preferredSummaryStyle,
      });

      if (error) throw error;

      // Create a personal team (ignore if already exists)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: team } = await (supabase.from("teams") as any)
        .insert({ name: `${data.company} Team`, owner_id: user.id })
        .select()
        .single();

      if (team) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("team_members") as any).insert({
          team_id: team.id,
          user_id: user.id,
          role: "owner",
        });
      }

      toast.success("Welcome to MeetFlow! 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">MeetFlow</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-brand" : "bg-border"}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold mb-1">Tell us about yourself</h1>
              <p className="text-muted-foreground text-sm mb-8">
                This helps us personalize your experience
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="onboard-name" className="block text-sm font-medium mb-1.5">Full name</label>
                  <input
                    id="onboard-name"
                    type="text"
                    placeholder="Jane Smith"
                    {...register("fullName")}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label htmlFor="onboard-role" className="block text-sm font-medium mb-1.5">Your role</label>
                  <input
                    id="onboard-role"
                    type="text"
                    placeholder="Engineering Manager"
                    {...register("role")}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  {errors.role && <p className="text-destructive text-xs mt-1">{errors.role.message}</p>}
                </div>

                <div>
                  <label htmlFor="onboard-company" className="block text-sm font-medium mb-1.5">Company</label>
                  <input
                    id="onboard-company"
                    type="text"
                    placeholder="Acme Corp"
                    {...register("company")}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  {errors.company && <p className="text-destructive text-xs mt-1">{errors.company.message}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand/90 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-1">How should AI summarize?</h2>
              <p className="text-muted-foreground text-sm mb-8">
                Choose your preferred AI summary style
              </p>

              <div className="space-y-3">
                {summaryStyles.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setValue("preferredSummaryStyle", style.value as FormData["preferredSummaryStyle"])}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedStyle === style.value
                        ? "border-brand bg-brand/10"
                        : "border-border hover:border-brand/30"
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{style.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 rounded-lg border border-border hover:bg-secondary transition-colors font-medium text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Let&apos;s go →
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
