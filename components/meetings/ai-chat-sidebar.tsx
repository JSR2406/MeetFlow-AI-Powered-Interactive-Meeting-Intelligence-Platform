"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Sparkles, Send, Loader2, ThumbsUp, ThumbsDown, RotateCcw,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

const QUICK_CHIPS = [
  { label: "Summarize", prompt: "Please summarize this meeting" },
  { label: "Extract actions", prompt: "Extract all action items from this meeting" },
  { label: "Next steps", prompt: "What are the recommended next steps?" },
  { label: "Blockers", prompt: "What were the blockers mentioned?" },
];

interface AIChatSidebarProps {
  meetingId: string;
  meetingTitle: string;
  transcript?: string;
  notesContent?: Database["public"]["Tables"]["notes"]["Row"]["content"];
  preferredStyle: string;
  userId: string;
}

export function AIChatSidebar({
  meetingId,
  meetingTitle,
  transcript,
  notesContent,
  preferredStyle,
  userId,
}: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your AI co-pilot for **${meetingTitle}**. I can help you summarize, extract action items, or answer questions about this meeting. What would you like to know?`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, setValue } = useForm<{ message: string }>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;
      reset();
      setLoading(true);

      const userMsg: Message = { id: Date.now().toString(), role: "user", content };
      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", isStreaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        const notesText = typeof notesContent === "object" && notesContent
          ? JSON.stringify(notesContent)
          : "";

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].filter((m) => m.id !== "welcome").map((m) => ({
              role: m.role,
              content: m.content,
            })),
            meetingId,
            meetingTitle,
            transcript: transcript?.slice(0, 6000),
            notesContent: notesText.slice(0, 3000),
            preferredStyle,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Failed to get response");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE chunks
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              const text = line.slice(2).replace(/^"|"$/g, "").replace(/\\n/g, "\n");
              accumulated += text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
              );
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );

        // Persist to DB
        const supabase = createClient();
        await supabase.from("ai_messages").insert([
          { meeting_id: meetingId, user_id: userId, role: "user", content },
          { meeting_id: meetingId, user_id: userId, role: "assistant", content: accumulated },
        ]);
      } catch {
        toast.error("AI request failed. Check your API key.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I encountered an error. Please try again.", isStreaming: false }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, meetingId, meetingTitle, transcript, notesContent, preferredStyle, userId, reset]
  );

  const handleFeedback = async (messageId: string, feedback: "helpful" | "not_helpful") => {
    const supabase = createClient();
    await supabase.from("ai_messages").update({
      metadata: { feedback },
    }).eq("id", messageId);
    toast.success(feedback === "helpful" ? "Thanks for the feedback!" : "Got it, we'll improve!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick chips */}
      <div className="p-3 border-b border-border/50">
        <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Quick actions</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.prompt)}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-border text-[11px] font-medium hover:border-brand/50 hover:bg-brand/5 hover:text-brand transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-2.5 h-2.5" />
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[90%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand text-white rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              }`}
            >
              {msg.isStreaming && !msg.content ? (
                <div className="flex gap-1 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === "assistant" && !msg.isStreaming && msg.id !== "welcome" && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleFeedback(msg.id, "helpful")}
                  className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-green-600"
                  aria-label="Helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleFeedback(msg.id, "not_helpful")}
                  className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-red-600"
                  aria-label="Not helpful"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => sendMessage(messages[messages.length - 2]?.content ?? "")}
                  className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-brand"
                  aria-label="Regenerate"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={handleSubmit(({ message }) => sendMessage(message))}
          className="flex gap-2"
        >
          <input
            {...register("message")}
            placeholder="Ask AI anything about this meeting..."
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2 rounded-xl bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
            aria-label="Send message"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
