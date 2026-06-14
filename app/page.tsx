import Link from "next/link";
import { ArrowRight, Brain, Calendar, Users, Zap, CheckCircle, TrendingUp, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">MeetFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 relative">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/30 bg-brand/10 text-brand text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            AI-powered meeting intelligence
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in [animation-delay:100ms]">
            Your AI{" "}
            <span className="text-brand">Meeting</span>{" "}
            Co-Founder
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            MeetFlow transforms chaotic meetings into structured intelligence. 
            Auto-summarize, extract action items, and keep your team aligned — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in [animation-delay:300ms]">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand text-white font-semibold hover:bg-brand/90 transition-all hover:scale-105 shadow-lg shadow-brand/20"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border hover:border-brand/50 hover:bg-brand/5 transition-all font-medium"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4 animate-fade-in [animation-delay:400ms]">
            No credit card required · Free forever for individuals
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything your team needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From scheduling to follow-up, MeetFlow covers the entire meeting lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-border bg-card hover:border-brand/30 hover:bg-brand/5 transition-all group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                  <f.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6 border-y border-border bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-bold text-brand mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform your meetings?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of teams who run smarter meetings with MeetFlow.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-brand text-white font-semibold hover:bg-brand/90 transition-all hover:scale-105 shadow-lg shadow-brand/20"
          >
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="w-4 h-4 text-brand" />
            <span>MeetFlow © 2025</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Brain,
    title: "AI Summaries",
    desc: "Get instant, structured summaries of any meeting with key decisions, action items, and sentiment analysis.",
  },
  {
    icon: CheckCircle,
    title: "Action Item Extraction",
    desc: "Automatically pull action items from transcripts and assign them to team members with due dates.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "Schedule meetings with AI-suggested optimal times based on participant availability.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Real-time collaborative notes, agenda building, and live presence indicators.",
  },
  {
    icon: TrendingUp,
    title: "Meeting Analytics",
    desc: "Track completion rates, sentiment trends, and meeting efficiency over time.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Co-pilot",
    desc: "Ask questions about any meeting, get insights, and generate follow-up emails instantly.",
  },
];

const stats = [
  { value: "3x", label: "Faster follow-ups" },
  { value: "40%", label: "Fewer missed actions" },
  { value: "95%", label: "Summary accuracy" },
  { value: "10k+", label: "Teams trust us" },
];
