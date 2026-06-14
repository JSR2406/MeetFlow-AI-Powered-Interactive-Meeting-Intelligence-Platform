"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bold, Italic, List, ListOrdered, Heading2, Code, Quote,
} from "lucide-react";
import type { Database } from "@/types/database";

type Notes = Database["public"]["Tables"]["notes"]["Row"];

interface NotesEditorProps {
  meetingId: string;
  initialNotes: Notes | null;
  userId: string;
}

export function NotesEditor({ meetingId, initialNotes, userId }: NotesEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const saveContent = useCallback(
    async (json: object) => {
      await supabase
        .from("notes")
        .update({ content: json, updated_by: userId, updated_at: new Date().toISOString() })
        .eq("meeting_id", meetingId);
    },
    [meetingId, userId, supabase]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start taking notes… type / for commands",
      }),
    ],
    content: initialNotes?.content as object ?? { type: "doc", content: [] },
    editorProps: {
      attributes: {
        class: "tiptap-editor px-6 py-4 outline-none",
        "aria-label": "Meeting notes editor",
      },
    },
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveContent(editor.getJSON());
      }, 1000);
    },
  });

  // Sync when notes change from realtime
  useEffect(() => {
    if (editor && initialNotes?.content) {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(initialNotes.content);
      if (current !== incoming) {
        editor.commands.setContent(initialNotes.content as object);
      }
    }
  }, [initialNotes, editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-brand/10 text-brand"
          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border/50 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="Heading"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          label="Code"
        >
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          label="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
