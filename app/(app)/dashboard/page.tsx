import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Video,
  CheckSquare,
  TrendingUp,
  Smile,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatMeetingDate, getStatusColor, getDurationLabel, getPriorityColor } from "@/lib/utils";
import { format, startOfWeek, endOfWeek } from "date-fns";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // ── Demo mode shortcut ────────────────────────────────────────────────────
  if (isDemoMode) {
    return <DemoDashboard />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the user's teams
  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = teamMemberships?.map((t) => t.team_id) ?? [];

  const now = new Date();
  const weekStart = startOfWeek(now).toISOString();
  const weekEnd = endOfWeek(now).toISOString();

  // Parallel data fetches
  const [meetingsThisWeek, upcomingMeetings, openActionItems, overdueItems, recentMeetings] =
    await Promise.all([
      // Meetings this week
      teamIds.length
        ? supabase
            .from("meetings")
            .select("id")
            .in("team_id", teamIds)
            .gte("scheduled_at", weekStart)
            .lte("scheduled_at", weekEnd)
        : { data: [] },

      // Upcoming meetings (next 5)
      teamIds.length
        ? supabase
            .from("meetings")
            .select("id, title, scheduled_at, duration_minutes, status")
            .in("team_id", teamIds)
            .gte("scheduled_at", now.toISOString())
            .order("scheduled_at", { ascending: true })
            .limit(5)
        : { data: [] },

      // Open action items count
      teamIds.length
        ? supabase
            .from("action_items")
            .select("id", { count: "exact" })
            .eq("assignee_id", user.id)
            .neq("status", "done")
        : { count: 0 },

      // Overdue action items
      supabase
        .from("action_items")
        .select("id, title, due_date, status, priority, meeting_id")
        .eq("assignee_id", user.id)
        .neq("status", "done")
        .lt("due_date", format(now, "yyyy-MM-dd"))
        .order("due_date", { ascending: true })
        .limit(5),

      // Recent meetings for activity feed
      teamIds.length
        ? supabase
            .from("meetings")
            .select("id, title, scheduled_at, status")
            .in("team_id", teamIds)
            .order("scheduled_at", { ascending: false })
            .limit(8)
        : { data: [] },
    ]);

  const stats = [
    {
      label: "Meetings this week",
      value: meetingsThisWeek.data?.length ?? 0,
      icon: Video,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      change: "+2 vs last week",
    },
    {
      label: "Open action items",
      value: openActionItems.count ?? 0,
      icon: CheckSquare,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      change: "Assigned to you",
    },
    {
      label: "Completion rate",
      value: "—",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
      change: "Coming soon",
    },
    {
      label: "Avg. sentiment",
      value: "—",
      icon: Smile,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      change: "Run AI analysis",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(now, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link
          href="/scheduler?new=1"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          + New meeting
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl border border-border bg-card hover:border-brand/20 transition-all animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming meetings */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Upcoming Meetings</h2>
            <Link href="/scheduler" className="text-xs text-brand hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!upcomingMeetings.data || upcomingMeetings.data.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No upcoming meetings"
              desc="Schedule a meeting to get started"
              href="/scheduler?new=1"
              action="Schedule meeting"
            />
          ) : (
            <div className="space-y-2">
              {upcomingMeetings.data.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}/workspace`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                      <Video className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-brand transition-colors">
                        {m.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMeetingDate(m.scheduled_at)} · {getDurationLabel(m.duration_minutes)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(m.status)}`}>
                    {m.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Overdue action items */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              Overdue Items
            </h2>
            <Link href="/planner" className="text-xs text-brand hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!overdueItems.data || overdueItems.data.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="All caught up!"
              desc="No overdue action items"
            />
          ) : (
            <div className="space-y-2">
              {overdueItems.data.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-destructive" />
                    <span className="text-xs text-destructive">
                      Due {item.due_date}
                    </span>
                    {item.priority && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Recent Activity</h2>

        {!recentMeetings.data || recentMeetings.data.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No recent activity"
            desc="Your meeting history will appear here"
          />
        ) : (
          <div className="space-y-0 divide-y divide-border">
            {recentMeetings.data.map((m) => (
              <Link
                key={m.id}
                href={`/meetings/${m.id}/workspace`}
                className="flex items-center gap-3 py-3 hover:text-brand transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  m.status === "completed" ? "bg-green-500" :
                  m.status === "live" ? "bg-brand animate-pulse" :
                  m.status === "cancelled" ? "bg-destructive" : "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium group-hover:text-brand truncate">{m.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{formatMeetingDate(m.scheduled_at)}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(m.status)}`}>
                  {m.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  href,
  action,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">{desc}</p>
      {href && action && (
        <Link
          href={href}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors font-medium"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

// ── Demo Dashboard (shown when NEXT_PUBLIC_DEMO_MODE=true) ─────────────────
function DemoDashboard() {
  const now = new Date();
  const demoMeetings = [
    { id: "1", title: "Q3 Planning Session", scheduled_at: new Date(now.getTime() + 2 * 3600000).toISOString(), duration_minutes: 60, status: "scheduled" as const },
    { id: "2", title: "Product Standup", scheduled_at: new Date(now.getTime() + 5 * 3600000).toISOString(), duration_minutes: 15, status: "scheduled" as const },
    { id: "3", title: "Design Review", scheduled_at: new Date(now.getTime() + 24 * 3600000).toISOString(), duration_minutes: 45, status: "scheduled" as const },
  ];
  const demoActivity = [
    { id: "4", title: "Engineering Retrospective", scheduled_at: new Date(now.getTime() - 24 * 3600000).toISOString(), status: "completed" as const },
    { id: "5", title: "All-Hands Meeting", scheduled_at: new Date(now.getTime() - 48 * 3600000).toISOString(), status: "completed" as const },
    { id: "6", title: "Sprint Demo", scheduled_at: new Date(now.getTime() - 3 * 3600000).toISOString(), status: "live" as const },
  ];
  const demoStats = [
    { label: "Meetings this week", value: 5, icon: Video, color: "text-blue-500", bg: "bg-blue-500/10", change: "+2 vs last week" },
    { label: "Open action items", value: 8, icon: CheckSquare, color: "text-orange-500", bg: "bg-orange-500/10", change: "Assigned to you" },
    { label: "Completion rate", value: "87%", icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", change: "↑ 12% this month" },
    { label: "Avg. sentiment", value: "😊", icon: Smile, color: "text-purple-500", bg: "bg-purple-500/10", change: "Positive (4.2/5)" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Demo banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand/10 border border-brand/20 text-sm text-brand font-medium">
        <span className="text-base">🎭</span>
        <span>Demo Mode — Explore MeetFlow with sample data.</span>
        <Link href="/login" className="ml-auto underline hover:no-underline text-brand">Sign in for full access →</Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{format(now, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Link href="/scheduler?new=1" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors">
          + New meeting
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {demoStats.map((stat, i) => (
          <div key={stat.label} className="p-5 rounded-2xl border border-border bg-card hover:border-brand/20 transition-all animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-xs text-muted-foreground/60 mt-1">{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Upcoming Meetings</h2>
            <Link href="/scheduler" className="text-xs text-brand hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {demoMeetings.map((m) => (
              <Link key={m.id} href={`/meetings/${m.id}/workspace`} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                    <Video className="w-3.5 h-3.5 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-brand transition-colors">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{formatMeetingDate(m.scheduled_at)} · {getDurationLabel(m.duration_minutes)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(m.status)}`}>{m.status}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-500" />Action Items</h2>
            <Link href="/planner" className="text-xs text-brand hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {[
              { title: "Finalize Q3 roadmap", due: "2025-06-15", priority: "high" },
              { title: "Update API docs", due: "2025-06-16", priority: "medium" },
              { title: "Review PRs from last sprint", due: "2025-06-14", priority: "high" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-secondary/50">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Due {item.due}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Recent Activity</h2>
        <div className="space-y-0 divide-y divide-border">
          {demoActivity.map((m) => (
            <Link key={m.id} href={`/meetings/${m.id}/workspace`} className="flex items-center gap-3 py-3 hover:text-brand transition-colors group">
              <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === "completed" ? "bg-green-500" : m.status === "live" ? "bg-brand animate-pulse" : "bg-blue-500"}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium group-hover:text-brand truncate">{m.title}</span>
                <span className="text-xs text-muted-foreground ml-2">{formatMeetingDate(m.scheduled_at)}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(m.status)}`}>{m.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
