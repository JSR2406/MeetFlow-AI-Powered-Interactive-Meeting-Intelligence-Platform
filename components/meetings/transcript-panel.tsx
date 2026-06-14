"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface TranscriptPanelProps {
  meetingId: string;
  initialTranscript: Transcript | null;
  onTranscriptSaved: (t: Transcript) => void;
  onClose: () => void;
}

export function TranscriptPanel({
  meetingId,
  initialTranscript,
  onTranscriptSaved,
  onClose,
}: TranscriptPanelProps) {
  const [text, setText] = useState(initialTranscript?.raw_text ?? "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("transcripts")
        .select("id")
        .eq("meeting_id", meetingId)
        .single();

      let result;
      if (existing) {
        result = await supabase
          .from("transcripts")
          .update({ raw_text: text })
          .eq("id", existing.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("transcripts")
          .insert({ meeting_id: meetingId, raw_text: text })
          .select()
          .single();
      }

      if (result.error) throw result.error;
      if (result.data) onTranscriptSaved(result.data);
      toast.success("Transcript saved");
    } catch {
      toast.error("Failed to save transcript");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("text") && !file.name.endsWith(".txt")) {
      toast.error("Only .txt files are supported");
      return;
    }
    const content = await file.text();
    setText(content);
    toast.success(`Loaded ${file.name}`);
  };

  return (
    <div className="p-4 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Transcript</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            paste-in · {/* TODO: integrate Deepgram for real-time transcription */}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-xs text-brand hover:underline"
          >
            <Upload className="w-3 h-3" />
            Upload .txt
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your meeting transcript here… or upload a .txt file above"
        rows={6}
        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand/50"
      />

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted-foreground">
          {text.length > 0 ? `${text.split(/\s+/).length} words` : "No transcript yet"}
        </span>
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Save transcript
        </button>
      </div>
    </div>
  );
}
