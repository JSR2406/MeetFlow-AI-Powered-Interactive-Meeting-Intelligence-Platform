"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { updateActionItemStatus } from "@/lib/actions/action-items";
import { Clock, GripVertical, AlertCircle } from "lucide-react";
import { getPriorityColor, truncate } from "@/lib/utils";
import type { Database } from "@/types/database";

type ActionItem = Database["public"]["Tables"]["action_items"]["Row"];
type Status = "todo" | "in_progress" | "done";

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "text-orange-500" },
  { id: "in_progress", label: "In Progress", color: "text-blue-500" },
  { id: "done", label: "Done", color: "text-green-500" },
];

function KanbanCard({ item, isDragging = false }: { item: ActionItem; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-3 rounded-xl border border-border bg-card hover:border-brand/30 hover:shadow-sm transition-all ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag card"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-relaxed">{truncate(item.title, 80)}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </span>
            )}
            {item.due_date && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />
                {item.due_date}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  items,
}: {
  column: (typeof COLUMNS)[number];
  items: ActionItem[];
}) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${column.color}`}>
          {column.label}
        </h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="flex-1 p-3 rounded-2xl border border-border bg-secondary/20 min-h-[200px]">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <KanbanCard key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <AlertCircle className="w-5 h-5 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No items</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ initialItems }: { initialItems: ActionItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [activeItem, setActiveItem] = useState<ActionItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getItemsByStatus = (status: Status) => items.filter((i) => i.status === status);

  const findColumnOfItem = (id: string) => {
    return items.find((i) => i.id === id)?.status as Status | undefined;
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item ?? null);
  }, [items]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = findColumnOfItem(active.id as string);
    const overColumn = COLUMNS.find((c) => c.id === over.id)?.id
      ?? findColumnOfItem(over.id as string);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === active.id ? { ...item, status: overColumn } : item
      )
    );
  }, [items]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active } = event;
      setActiveItem(null);

      const item = items.find((i) => i.id === active.id);
      if (!item) return;

      const result = await updateActionItemStatus(item.id, item.status as Status);
      if (result.error) {
        toast.error("Failed to update status");
        // Revert
        setItems(initialItems);
      } else {
        toast.success(`Moved to ${item.status.replace("_", " ")}`);
      }
    },
    [items, initialItems]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.id} column={col} items={getItemsByStatus(col.id)} />
        ))}
      </div>

      <DragOverlay>
        {activeItem && <KanbanCard item={activeItem} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
