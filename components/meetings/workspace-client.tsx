"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AgendaPanel } from "./agenda-panel";
import { NotesEditor } from "./notes-editor";
import { AIChatSidebar } from "./ai-chat-sidebar";
import { TranscriptPanel } from "./transcript-panel";
import { FeedbackModal } from "./feedback-modal";
import { toast } from "sonner";
import {
  Video, ChevronDown, Mic, MessageSquare, PanelRight,
  Star, Clock, MoreHorizontal, CheckCircle2
} from "lucide-react";
import { formatMeetingDate, getDurationLabel, getStatusColor } from "@/lib/utils";
import type { Database } from "@/types/database";

type Meeting = Database["public"]["Tables"]["meetings"]["Row"] & { team_id: string };
type AgendaItem = Database["public"]["Tables"]["agenda_items"]["Row"];
type Notes = Database["public"]["Tables"]["notes"]["Row"];
type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];
type ActionItem = Database["public"]["Tables"]["action_items"]["Row"];

interface WorkspaceUser {
  id: string;
  email: string;
  full_name?: string | null;
  preferred_summary_style?: string | null;
}

interface WorkspaceClientProps {
  meeting: Meeting;
  initialAgenda: AgendaItem[];
  initialNotes: Notes | null;
  initialTranscript: Transcript | null;
  initialActionItems: ActionItem[];
  user: WorkspaceUser;
}

type Panel = "transcript" | "chat";

export function WorkspaceClient({
  meeting,
  initialAgenda,
  initialNotes,
  initialTranscript,
  initialActionItems,
  user,
}: WorkspaceClientProps) {
  const [agenda, setAgenda] = useState(initialAgenda);
  const [notes, setNotes] = useState(initialNotes);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [actionItems, setActionItems] = useState(initialActionItems);
  const [activeRightPanel, setActiveRightPanel] = useState<Panel>("chat");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [status, setStatus] = useState(meeting.status);
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([
    { emoji: "👍", count: 0 }, { emoji: "❤️", count: 0 }, { emoji: "🎉", count: 0 },
    { emoji: "🤔", count: 0 }, { emoji: "⚡", count: 0 },
  ]);

  const supabase = createClient();

  // Realtime: subscribe to notes changes
  useEffect(() => {
    const channel = supabase
      .channel(`workspace-${meeting.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `meeting_id=eq.${meeting.id}` },
        (payload) => {
          if (payload.new && (payload.new as Notes).updated_by !== user.id) {
            setNotes(payload.new as Notes);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_items", filter: `meeting_id=eq.${meeting.id}` },
        () => {
          // Refetch agenda
          supabase
            .from("agenda_items")
            .select("*")
            .eq("meeting_id", meeting.id)
            .order("position", { ascending: true })
            .then(({ data }) => { if (data) setAgenda(data); });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_items", filter: `meeting_id=eq.${meeting.id}` },
        () => {
          supabase
            .from("action_items")
            .select("*")
            .eq("meeting_id", meeting.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => { if (data) setActionItems(data); });
        }
      )
      // Ephemeral reactions via broadcast
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        if (payload.emoji) {
          setReactions((prev) =>
            prev.map((r) =>
              r.emoji === payload.emoji ? { ...r, count: r.count + 1 } : r
            )
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meeting.id, user.id, supabase]);

  const handleReaction = useCallback(async (emoji: string) => {
    setReactions((prev) =>
      prev.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
    );
    await supabase
      .channel(`workspace-${meeting.id}`)
      .send({ type: "broadcast", event: "reaction", payload: { emoji } });
  }, [meeting.id, supabase]);

  const handleMarkComplete = async () => {
    const { error } = await supabase
      .from("meetings")
      .update({ status: "completed" })
      .eq("id", meeting.id);

    if (!error) {
      setStatus("completed");
      toast.success("Meeting marked as complete");
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Meeting header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{meeting.title}</h1>
            <p className="text-xs text-muted-foreground">
              {formatMeetingDate(meeting.scheduled_at)} · {getDurationLabel(meeting.duration_minutes)}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Emoji reactions */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full border border-border bg-secondary/30">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className="text-sm hover:scale-125 transition-transform px-1"
                title={`React with ${r.emoji}`}
              >
                {r.emoji}
                {r.count > 0 && <span className="text-[10px] text-muted-foreground ml-0.5">{r.count}</span>}
              </button>
            ))}
          </div>

          {/* Transcript toggle */}
          <button
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              transcriptOpen ? "bg-brand text-white" : "border border-border hover:bg-secondary"
            }`}
          >
            <Mic className="w-3 h-3" />
            Transcript
          </button>

          {/* Mark complete */}
          {status !== "completed" && (
            <button
              onClick={handleMarkComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-600 text-xs font-medium transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </button>
          )}
        </div>
      </div>

      {/* Transcript panel (collapsible) */}
      {transcriptOpen && (
        <div className="border-b border-border">
          <TranscriptPanel
            meetingId={meeting.id}
            initialTranscript={transcript}
            onTranscriptSaved={setTranscript}
            onClose={() => setTranscriptOpen(false)}
          />
        </div>
      )}

      {/* Three-pane workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Agenda */}
        <div className="w-64 border-r border-border shrink-0 overflow-y-auto">
          <AgendaPanel
            meetingId={meeting.id}
            initialItems={agenda}
          />
        </div>

        {/* Center: Notes */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Sentiment + notes info bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Auto-saved</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Action items: {actionItems.length}</span>
              <button className="p-1 rounded hover:bg-secondary transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <NotesEditor
              meetingId={meeting.id}
              initialNotes={notes}
              userId={user.id}
            />
          </div>
        </div>

        {/* Right: AI Chat / Action Items */}
        <div className="w-80 border-l border-border flex flex-col shrink-0">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveRightPanel("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeRightPanel === "chat"
                  ? "text-brand border-b-2 border-brand"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Chat
            </button>
            <button
              onClick={() => setActiveRightPanel("transcript")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeRightPanel === "transcript"
                  ? "text-brand border-b-2 border-brand"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
              Actions ({actionItems.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeRightPanel === "chat" ? (
              <AIChatSidebar
                meetingId={meeting.id}
                meetingTitle={meeting.title}
                transcript={transcript?.raw_text}
                notesContent={notes?.content}
                preferredStyle={user.preferred_summary_style ?? "concise"}
                userId={user.id}
              />
            ) : (
              <ActionItemsList items={actionItems} />
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        meetingId={meeting.id}
        userId={user.id}
      />
    </div>
  );
}

function ActionItemsList({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 px-4 text-center">
        <CheckCircle2 className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium mb-1">No action items yet</p>
        <p className="text-xs text-muted-foreground">Use AI to extract action items from your transcript</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="p-3 rounded-xl border border-border bg-card/50">
          <p className="text-xs font-medium">{item.title}</p>
          {item.due_date && (
            <p className="text-[11px] text-muted-foreground mt-1">Due {item.due_date}</p>
          )}
          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${
            item.status === "done" ? "bg-green-500/10 text-green-600" :
            item.status === "in_progress" ? "bg-blue-500/10 text-blue-600" :
            "bg-orange-500/10 text-orange-600"
          }`}>
            {item.status.replace("_", " ")}
          </span>
        </div>
      ))}
    </div>
  );
}
