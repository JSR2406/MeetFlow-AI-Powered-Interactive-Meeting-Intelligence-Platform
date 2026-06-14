"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, User, Sliders, Brain, Puzzle, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface SettingsClientProps {
  user: { id: string; email: string };
  profile: Profile | null;
}

const profileSchema = z.object({
  full_name: z.string().min(1, "Required"),
  role: z.string().optional(),
  company: z.string().optional(),
  preferred_summary_style: z.enum(["concise", "detailed", "executive", "technical"]),
});

type ProfileForm = z.infer<typeof profileSchema>;

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "ai", label: "AI Provider", icon: Brain },
  { id: "integrations", label: "Integrations", icon: Puzzle },
];

const SUMMARY_STYLES = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "executive", label: "Executive" },
  { value: "technical", label: "Technical" },
];

export function SettingsClient({ user, profile }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [aiProvider, setAiProvider] = useState("openai");

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      role: profile?.role ?? "",
      company: profile?.company ?? "",
      preferred_summary_style: (profile?.preferred_summary_style as ProfileForm["preferred_summary_style"]) ?? "concise",
    },
  });

  const onSaveProfile = async (data: ProfileForm) => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
    setSaving(false);
  };

  const integrations = [
    { name: "Google Calendar", desc: "Sync meetings and check free/busy", status: "coming_soon", emoji: "📅" },
    { name: "Slack", desc: "Post summaries and action items", status: "coming_soon", emoji: "💬" },
    { name: "Jira", desc: "Create tickets from action items", status: "coming_soon", emoji: "🎯" },
    { name: "Notion", desc: "Export notes to Notion pages", status: "coming_soon", emoji: "📄" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-44 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-5">Profile</h2>
              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full name</label>
                  <input
                    {...register("full_name")}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  {errors.full_name && <p className="text-destructive text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-muted text-sm text-muted-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Role</label>
                    <input
                      {...register("role")}
                      placeholder="Engineering Manager"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Company</label>
                    <input
                      {...register("company")}
                      placeholder="Acme Corp"
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Preferred summary style</label>
                  <select
                    {...register("preferred_summary_style")}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    {SUMMARY_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save changes
                </button>
              </form>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-5">Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "Weekend-free scheduling", desc: "Exclude weekends when suggesting meeting times", id: "weekend-free" },
                  { label: "Auto-extract action items", desc: "Automatically extract when transcript is saved", id: "auto-extract" },
                  { label: "Email summaries", desc: "Receive meeting summaries via email", id: "email-summaries" },
                ].map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pref.desc}</p>
                    </div>
                    <button
                      id={pref.id}
                      className="w-10 h-5 rounded-full bg-brand transition-colors relative"
                      role="switch"
                      aria-checked="true"
                    >
                      <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-1">AI Provider</h2>
              <p className="text-xs text-muted-foreground mb-5">
                ⚠️ Security note: API keys are stored in your .env.local for demo purposes. In production, use server-side secrets only — never expose keys to the client.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <div className="flex gap-2">
                    {["openai", "groq"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setAiProvider(p)}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                          aiProvider === p
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border hover:border-brand/30"
                        }`}
                      >
                        {p === "openai" ? "OpenAI" : "Groq"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {aiProvider === "openai" ? "OPENAI_API_KEY" : "GROQ_API_KEY"}
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      placeholder="Set in .env.local"
                      disabled
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-input bg-muted text-sm text-muted-foreground"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Set <code className="text-brand">AI_PROVIDER={aiProvider}</code> in your .env.local</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-5">Integrations</h2>
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-brand/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground font-medium">
                      Coming soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
