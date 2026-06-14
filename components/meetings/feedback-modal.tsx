"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  meetingId: string;
  userId: string;
}

export function FeedbackModal({ open, onClose, meetingId, userId }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select a rating"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("feedback").insert({
      meeting_id: meetingId,
      user_id: userId,
      rating,
      comment: comment || null,
    });
    if (error) { toast.error("Failed to submit feedback"); }
    else { toast.success("Thanks for your feedback! 🙏"); onClose(); }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-popover border border-border rounded-2xl shadow-2xl p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-base font-semibold mb-1">Meeting complete!</h2>
          <p className="text-xs text-muted-foreground">How was this meeting?</p>
        </div>

        {/* Star rating */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              className="transition-transform hover:scale-125"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= (hovered || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-xs text-muted-foreground mb-4">
            {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
          </p>
        )}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any comments? (optional)"
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand/50 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors text-sm"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
