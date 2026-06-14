"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Check, X, Pencil, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type AgendaItem = Database["public"]["Tables"]["agenda_items"]["Row"];

interface AgendaPanelProps {
  meetingId: string;
  initialItems: AgendaItem[];
}

function SortableAgendaItem({
  item,
  onUpdate,
  onDelete,
}: {
  item: AgendaItem;
  onUpdate: (id: string, title: string, duration: number | null) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDuration, setEditDuration] = useState(item.duration_minutes?.toString() ?? "");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(item.id, editTitle, editDuration ? parseInt(editDuration) : null);
      setEditing(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      {editing ? (
        <div className="p-2 rounded-xl border border-brand/30 bg-brand/5 space-y-2">
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-brand/50"
          />
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <input
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              placeholder="min"
              className="w-14 text-xs px-2 py-1 rounded-lg border border-input bg-background focus:outline-none"
            />
            <div className="flex gap-1 ml-auto">
              <button onClick={handleSave} className="p-1 rounded-lg bg-brand text-white hover:bg-brand/90">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1 rounded-lg border border-border hover:bg-secondary">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-2 rounded-xl hover:bg-secondary/50 transition-colors">
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{item.title}</p>
            {item.duration_minutes && (
              <p className="text-[11px] text-muted-foreground">{item.duration_minutes}m</p>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-secondary transition-colors">
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgendaPanel({ meetingId, initialItems }: AgendaPanelProps) {
  const [items, setItems] = useState(initialItems);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);

      // Persist new positions
      await Promise.all(
        reordered.map((item, idx) =>
          supabase.from("agenda_items").update({ position: idx }).eq("id", item.id)
        )
      );
    },
    [items, supabase]
  );

  const handleUpdate = useCallback(
    async (id: string, title: string, duration: number | null) => {
      const { error } = await supabase
        .from("agenda_items")
        .update({ title, duration_minutes: duration })
        .eq("id", id);

      if (!error) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, title, duration_minutes: duration } : i))
        );
      }
    },
    [supabase]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await supabase.from("agenda_items").delete().eq("id", id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [supabase]
  );

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const position = items.length;
    const { data, error } = await supabase
      .from("agenda_items")
      .insert({ meeting_id: meetingId, title: newTitle, position })
      .select()
      .single();

    if (!error && data) {
      setItems((prev) => [...prev, data]);
      setNewTitle("");
      setAdding(false);
    } else {
      toast.error("Failed to add agenda item");
    }
  };

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agenda</h2>
        <button
          onClick={() => setAdding(true)}
          className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Add agenda item"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {items.length === 0 && !adding && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <p className="text-xs text-muted-foreground">No agenda items</p>
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-brand hover:underline mt-1"
          >
            Add first item
          </button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1 flex-1">
            {items.map((item) => (
              <SortableAgendaItem
                key={item.id}
                item={item}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {adding && (
        <div className="mt-2 p-2 rounded-xl border border-brand/30 bg-brand/5">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
            placeholder="New agenda item..."
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-brand/50"
          />
          <div className="flex gap-1 mt-2">
            <button
              onClick={handleAdd}
              className="flex-1 text-xs py-1 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 text-xs py-1 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
