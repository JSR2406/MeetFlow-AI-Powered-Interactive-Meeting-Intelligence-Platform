import { Zap, Video, MessageSquare, Webhook, Key, ArrowRight, CheckCircle, Clock, BookOpen, Brain } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Integrations — MeetFlow" };

const INTEGRATIONS = [
  {
    id: "zoom",
    name: "Zoom",
    logo: "🎥",
    status: "available",
    badge: "Zoom App",
    description: "Launch MeetFlow as a side panel inside any Zoom meeting. Get live transcription, AI notes and action items without leaving Zoom.",
    features: ["Live transcript via Zoom Web SDK", "Side-panel workspace during meetings", "Auto-import meeting participants", "Post-meeting AI summary pushed to Zoom chat"],
    setupSteps: ["Install from Zoom App Marketplace", "Authorize with your MeetFlow account", "Open MeetFlow panel during any Zoom call"],
    docsUrl: "https://marketplace.zoom.us",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    badgeColor: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    logo: "💼",
    status: "available",
    badge: "Teams Tab",
    description: "Add MeetFlow as a tab inside any Teams channel or meeting. Full workspace — notes, AI chat, kanban — embedded directly in Teams.",
    features: ["Teams Tab (runs in iframe during meetings)", "Receive meeting events via Teams Bot", "Auto-capture transcript via Teams Graph API", "Action items synced to Teams Planner"],
    setupSteps: ["Add MeetFlow app from Teams App Store", "Pin as a tab in your team channel", "Join a meeting and open the MeetFlow tab"],
    docsUrl: "https://teams.microsoft.com/l/app",
    color: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/30",
    badgeColor: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "google-meet",
    name: "Google Meet",
    logo: "📹",
    status: "coming-soon",
    badge: "Meet Add-on",
    description: "Use MeetFlow as a Google Meet add-on. Opens a side panel powered by the Google Workspace Add-ons SDK.",
    features: ["Google Meet side-panel add-on", "Google Drive notes sync", "Calendar integration for auto-agenda", "Gmail action item reminders"],
    setupSteps: ["Install from Google Workspace Marketplace", "Authorize Google account", "MeetFlow panel opens automatically in Meet"],
    docsUrl: "#",
    color: "from-green-500/20 to-green-600/10",
    borderColor: "border-green-500/30",
    badgeColor: "bg-green-500/10 text-green-600",
  },
  {
    id: "slack",
    name: "Slack",
    logo: "💬",
    status: "available",
    badge: "Slack App",
    description: "Post AI meeting summaries, action items and key decisions directly to your Slack channels after every meeting.",
    features: ["Post summaries to any channel", "/meetflow slash command", "Action item reminders as DMs", "Daily digest of upcoming meetings"],
    setupSteps: ["Click 'Add to Slack'", "Choose your workspace", "Select default channel for summaries"],
    docsUrl: "#",
    color: "from-yellow-500/20 to-yellow-600/10",
    borderColor: "border-yellow-500/30",
    badgeColor: "bg-yellow-500/10 text-yellow-600",
  },
  {
    id: "webhook",
    name: "Webhooks / API",
    logo: "🔗",
    status: "available",
    badge: "REST API",
    description: "Connect MeetFlow to any tool with our REST API and webhooks. Send meeting data to Notion, Jira, Linear, Salesforce — anywhere.",
    features: ["POST webhook on meeting complete", "REST API for notes & transcripts", "Action items push to Jira/Linear", "Zapier & Make.com connectors"],
    setupSteps: ["Generate API key in Settings", "Configure webhook URL", "Receive meeting events in real-time"],
    docsUrl: "#",
    color: "from-gray-500/20 to-gray-600/10",
    borderColor: "border-gray-500/30",
    badgeColor: "bg-gray-500/10 text-gray-500",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Install the app / extension",
    desc: "Add MeetFlow to Zoom, Teams or Google Meet from their respective app marketplaces. One-click OAuth to connect your account.",
    icon: Zap,
  },
  {
    step: "2",
    title: "Join a meeting as usual",
    desc: "MeetFlow opens as a side panel inside Zoom/Teams. Your workspace — notes editor, agenda, AI chat — is right there during the call.",
    icon: Video,
  },
  {
    step: "3",
    title: "AI captures everything in real-time",
    desc: "Live transcript via the platform's transcription API. AI extracts action items and key decisions as the meeting happens.",
    icon: Brain,
  },
  {
    step: "4",
    title: "Post-meeting summary delivered automatically",
    desc: "When the meeting ends, AI generates a full summary and pushes it to Slack, Teams chat, or email — wherever your team lives.",
    icon: MessageSquare,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-brand" />
          Integrations
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect MeetFlow to your existing tools. Use it as a Zoom App, Teams Tab, or via API.
        </p>
      </div>

      {/* How it works */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">How the Zoom / Teams Integration Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                <step.icon className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="text-xs text-brand font-semibold mb-0.5">Step {step.step}</div>
                <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration cards */}
      <section className="space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Available Integrations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.id}
              className={`rounded-2xl border ${integration.borderColor} bg-gradient-to-br ${integration.color} p-5 flex flex-col gap-4`}
            >
              {/* Title row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.logo}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{integration.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${integration.badgeColor}`}>
                        {integration.badge}
                      </span>
                    </div>
                  </div>
                </div>
                {integration.status === "available" ? (
                  <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                    <CheckCircle className="w-3 h-3" /> Available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <Clock className="w-3 h-3" /> Coming Soon
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>

              {/* Features */}
              <div className="space-y-1.5">
                {integration.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-brand shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Setup steps */}
              <div className="border-t border-border/40 pt-3">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Setup</p>
                <ol className="space-y-1">
                  {integration.setupSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-4 h-4 rounded-full bg-brand/10 text-brand text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* CTA */}
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  integration.status === "available"
                    ? "bg-brand text-white hover:bg-brand/90"
                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                }`}
              >
                {integration.status === "available" ? (
                  <>Connect {integration.name} <ArrowRight className="w-3 h-3" /></>
                ) : (
                  "Notify me when available"
                )}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* API key section */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-brand" />
          <h2 className="font-semibold text-sm">API Access</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Use the MeetFlow REST API to programmatically access meeting notes, transcripts, action items and AI summaries.
          Build your own integrations with any tool that supports webhooks or REST.
        </p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border font-mono text-xs">
          <span className="text-muted-foreground">Base URL:</span>
          <span className="text-brand">https://meetflow-copilot-jsr2406.vercel.app/api/</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { method: "GET", path: "/api/meetings", desc: "List all meetings" },
            { method: "GET", path: "/api/meetings/:id/notes", desc: "Get meeting notes" },
            { method: "POST", path: "/api/ai/summarize", desc: "AI summarize transcript" },
          ].map((ep) => (
            <div key={ep.path} className="p-3 rounded-xl border border-border bg-background/50">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ep.method === "GET" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}`}>
                  {ep.method}
                </span>
                <code className="text-[10px] text-muted-foreground truncate">{ep.path}</code>
              </div>
              <p className="text-muted-foreground">{ep.desc}</p>
            </div>
          ))}
        </div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-medium">
          <Key className="w-3 h-3" /> Generate your API key in Settings →
        </Link>
      </section>

      {/* Webhook info */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Webhook className="w-4 h-4 text-brand" />
          <h2 className="font-semibold text-sm">Webhook Events</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Configure a webhook URL and MeetFlow will POST a JSON payload to it when these events occur:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            "meeting.completed",
            "meeting.started",
            "notes.updated",
            "transcript.created",
            "action_item.created",
            "ai.summary.ready",
          ].map((event) => (
            <code key={event} className="text-[11px] px-3 py-2 rounded-lg border border-border bg-secondary/50 text-muted-foreground">
              {event}
            </code>
          ))}
        </div>
      </section>
    </div>
  );
}
