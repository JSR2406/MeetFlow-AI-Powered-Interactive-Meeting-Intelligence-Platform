-- ============================================================
-- MeetFlow Initial Schema Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE meeting_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE action_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE participant_status AS ENUM ('invited', 'accepted', 'declined');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  role TEXT,
  company TEXT,
  preferred_summary_style TEXT DEFAULT 'concise',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  PRIMARY KEY (team_id, user_id)
);

-- ============================================================
-- MEETINGS
-- ============================================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX meetings_team_id_idx ON meetings (team_id);
CREATE INDEX meetings_scheduled_at_idx ON meetings (scheduled_at);

-- ============================================================
-- MEETING PARTICIPANTS
-- ============================================================
CREATE TABLE meeting_participants (
  meeting_id UUID NOT NULL REFERENCES meetings ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  status participant_status NOT NULL DEFAULT 'invited',
  PRIMARY KEY (meeting_id, user_id)
);

-- ============================================================
-- AGENDA ITEMS
-- ============================================================
CREATE TABLE agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX agenda_items_meeting_id_idx ON agenda_items (meeting_id);

-- ============================================================
-- NOTES (single doc per meeting, TipTap JSON)
-- ============================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL UNIQUE REFERENCES meetings ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- TRANSCRIPTS
-- ============================================================
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACTION ITEMS
-- ============================================================
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users ON DELETE SET NULL,
  due_date DATE,
  status action_status NOT NULL DEFAULT 'todo',
  priority priority_level DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX action_items_meeting_id_idx ON action_items (meeting_id);
CREATE INDEX action_items_assignee_id_idx ON action_items (assignee_id);
CREATE INDEX action_items_status_idx ON action_items (status);

-- ============================================================
-- DECISIONS
-- ============================================================
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings ON DELETE CASCADE,
  title TEXT NOT NULL,
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI MESSAGES
-- ============================================================
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_messages_meeting_id_idx ON ai_messages (meeting_id);
CREATE INDEX ai_messages_user_id_idx ON ai_messages (user_id);

-- ============================================================
-- FEEDBACK
-- ============================================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Helper function: is user a team member?
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: is user a meeting participant (via team)?
CREATE OR REPLACE FUNCTION can_access_meeting(p_meeting_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = p_meeting_id AND is_team_member(m.team_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams: visible to members
CREATE POLICY "teams_select" ON teams FOR SELECT USING (is_team_member(id));
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (auth.uid() = owner_id);

-- Team members
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_members_delete" ON team_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
  OR user_id = auth.uid()
);

-- Meetings
CREATE POLICY "meetings_select" ON meetings FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "meetings_insert" ON meetings FOR INSERT WITH CHECK (is_team_member(team_id) AND auth.uid() = created_by);
CREATE POLICY "meetings_update" ON meetings FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY "meetings_delete" ON meetings FOR DELETE USING (auth.uid() = created_by);

-- Meeting participants
CREATE POLICY "meeting_participants_select" ON meeting_participants FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "meeting_participants_insert" ON meeting_participants FOR INSERT WITH CHECK (can_access_meeting(meeting_id));
CREATE POLICY "meeting_participants_update" ON meeting_participants FOR UPDATE USING (can_access_meeting(meeting_id));

-- Agenda items
CREATE POLICY "agenda_items_select" ON agenda_items FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "agenda_items_insert" ON agenda_items FOR INSERT WITH CHECK (can_access_meeting(meeting_id));
CREATE POLICY "agenda_items_update" ON agenda_items FOR UPDATE USING (can_access_meeting(meeting_id));
CREATE POLICY "agenda_items_delete" ON agenda_items FOR DELETE USING (can_access_meeting(meeting_id));

-- Notes
CREATE POLICY "notes_select" ON notes FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "notes_insert" ON notes FOR INSERT WITH CHECK (can_access_meeting(meeting_id));
CREATE POLICY "notes_update" ON notes FOR UPDATE USING (can_access_meeting(meeting_id));

-- Transcripts
CREATE POLICY "transcripts_select" ON transcripts FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "transcripts_insert" ON transcripts FOR INSERT WITH CHECK (can_access_meeting(meeting_id));

-- Action items
CREATE POLICY "action_items_select" ON action_items FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "action_items_insert" ON action_items FOR INSERT WITH CHECK (can_access_meeting(meeting_id));
CREATE POLICY "action_items_update" ON action_items FOR UPDATE USING (can_access_meeting(meeting_id));
CREATE POLICY "action_items_delete" ON action_items FOR DELETE USING (can_access_meeting(meeting_id));

-- Decisions
CREATE POLICY "decisions_select" ON decisions FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "decisions_insert" ON decisions FOR INSERT WITH CHECK (can_access_meeting(meeting_id));

-- AI messages
CREATE POLICY "ai_messages_select" ON ai_messages FOR SELECT USING (
  user_id = auth.uid() OR (meeting_id IS NOT NULL AND can_access_meeting(meeting_id))
);
CREATE POLICY "ai_messages_insert" ON ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback
CREATE POLICY "feedback_select" ON feedback FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "feedback_insert" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents
CREATE POLICY "documents_select" ON documents FOR SELECT USING (can_access_meeting(meeting_id));
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (can_access_meeting(meeting_id) AND auth.uid() = uploaded_by);
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (auth.uid() = uploaded_by);

-- ============================================================
-- REALTIME PUBLICATIONS
-- ============================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE notes, agenda_items, action_items, ai_messages;
COMMIT;
