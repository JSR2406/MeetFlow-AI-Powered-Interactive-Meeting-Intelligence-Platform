"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Loader2, Plus, Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { createMeeting, suggestMeetingTimes } from "@/lib/actions/meetings";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduled_at: z.string().min(1, "Date/time is required"),
  duration_minutes: z.coerce.number().min(5).max(480),
  agenda_template: z.enum(["standup", "one_on_one", "planning", "retro", "custom"]),
});

type FormData = z.infer<typeof schema>;

const TEMPLATES = [
  { value: "standup", label: "Daily Standup", emoji: "⚡" },
  { value: "one_on_one", label: "1:1", emoji: "🤝" },
  { value: "planning", label: "Planning", emoji: "📋" },
  { value: "retro", label: "Retrospective", emoji: "🔄" },
  { value: "custom", label: "Custom", emoji: "✨" },
];

interface NewMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date | null;
}

export function NewMeetingDialog({ open, onClose, defaultDate }: NewMeetingDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [participantEmail, setParticipantEmail] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [suggestedSlots, setSuggestedSlots] = useState<
    { start: string; end: string; label: string; confidence: number }[]
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const defaultDateTime = defaultDate
    ? format(defaultDate, "yyyy-MM-dd'T'HH:mm")
    : format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'09:00");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduled_at: defaultDateTime,
      duration_minutes: 60,
      agenda_template: "custom",
    },
  });

  const selectedTemplate = watch("agenda_template");

  const addParticipant = () => {
    if (participantEmail && !participants.includes(participantEmail)) {
      setParticipants([...participants, participantEmail]);
      setParticipantEmail("");
    }
  };

  const handleSuggestTimes = async () => {
    setLoadingSlots(true);
    const duration = watch("duration_minutes");
    const result = await suggestMeetingTimes(duration, participants);
    setSuggestedSlots(result.slots);
    setLoadingSlots(false);
    toast.info("Smart suggestions are mock data — connect Google Calendar for real availability");
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const result = await createMeeting({ ...data, participant_emails: participants });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Meeting created!");
      onClose();
      router.refresh();
      if (result.data) router.push(`/meetings/${result.data.id}/workspace`);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-popover border border-border rounded-2xl shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold">New Meeting</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Meeting title *</label>
            <input
              {...register("title")}
              placeholder="Q3 Planning Session"
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="What's this meeting about?"
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
            />
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date & Time *</label>
              <input
                type="datetime-local"
                {...register("scheduled_at")}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              {errors.scheduled_at && <p className="text-destructive text-xs mt-1">{errors.scheduled_at.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="number"
                  {...register("duration_minutes")}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
            </div>
          </div>

          {/* Smart Suggest */}
          <div>
            <button
              type="button"
              onClick={handleSuggestTimes}
              disabled={loadingSlots}
              className="flex items-center gap-2 text-xs text-brand hover:text-brand/80 font-medium transition-colors"
            >
              {loadingSlots ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Smart Suggest Times
            </button>
            {suggestedSlots.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {suggestedSlots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setValue("scheduled_at", slot.start.slice(0, 16))}
                    className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-brand/50 hover:bg-brand/5 text-xs transition-colors"
                  >
                    <span className="font-medium">{slot.label}</span>
                    <span className="ml-2 text-muted-foreground">({Math.round(slot.confidence * 100)}% confidence)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agenda template */}
          <div>
            <label className="block text-sm font-medium mb-2">Agenda template</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue("agenda_template", t.value as FormData["agenda_template"])}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    selectedTemplate === t.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border hover:border-brand/30"
                  }`}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Participants</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addParticipant())}
                placeholder="colleague@company.com"
                className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {participants.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand/10 text-brand text-xs"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => setParticipants(participants.filter((e) => e !== email))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
