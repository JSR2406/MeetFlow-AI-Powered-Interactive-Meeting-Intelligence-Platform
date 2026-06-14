export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: string | null;
          company: string | null;
          preferred_summary_style: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: string | null;
          company?: string | null;
          preferred_summary_style?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: string | null;
          company?: string | null;
          preferred_summary_style?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
        };
        Insert: {
          team_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
        };
        Update: {
          team_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
        };
      };
      meetings: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          duration_minutes: number;
          status: "scheduled" | "live" | "completed" | "cancelled";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          description?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          status?: "scheduled" | "live" | "completed" | "cancelled";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          description?: string | null;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: "scheduled" | "live" | "completed" | "cancelled";
          created_by?: string;
          created_at?: string;
        };
      };
      meeting_participants: {
        Row: {
          meeting_id: string;
          user_id: string;
          email: string;
          status: "invited" | "accepted" | "declined";
        };
        Insert: {
          meeting_id: string;
          user_id: string;
          email: string;
          status?: "invited" | "accepted" | "declined";
        };
        Update: {
          meeting_id?: string;
          user_id?: string;
          email?: string;
          status?: "invited" | "accepted" | "declined";
        };
      };
      agenda_items: {
        Row: {
          id: string;
          meeting_id: string;
          position: number;
          title: string;
          duration_minutes: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          position: number;
          title: string;
          duration_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          position?: number;
          title?: string;
          duration_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          meeting_id: string;
          content: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          content?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          content?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          meeting_id: string;
          raw_text: string;
          language: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          raw_text: string;
          language?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          raw_text?: string;
          language?: string | null;
          created_at?: string;
        };
      };
      action_items: {
        Row: {
          id: string;
          meeting_id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          due_date: string | null;
          status: "todo" | "in_progress" | "done";
          priority: "low" | "medium" | "high" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          due_date?: string | null;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "medium" | "high" | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          due_date?: string | null;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "medium" | "high" | null;
          created_at?: string;
        };
      };
      decisions: {
        Row: {
          id: string;
          meeting_id: string;
          title: string;
          rationale: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          title: string;
          rationale?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          title?: string;
          rationale?: string | null;
          created_at?: string;
        };
      };
      ai_messages: {
        Row: {
          id: string;
          meeting_id: string | null;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id?: string | null;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string | null;
          user_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          meeting_id: string | null;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id?: string | null;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string | null;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          meeting_id: string;
          storage_path: string;
          filename: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          storage_path: string;
          filename: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          storage_path?: string;
          filename?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      meeting_status: "scheduled" | "live" | "completed" | "cancelled";
      action_status: "todo" | "in_progress" | "done";
      message_role: "user" | "assistant" | "system";
      team_role: "owner" | "admin" | "member";
    };
  };
};
