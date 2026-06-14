import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMeetingDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, "h:mm a")}`;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isMeetingPast(scheduledAt: string, durationMinutes: number): boolean {
  const end = new Date(new Date(scheduledAt).getTime() + durationMinutes * 60000);
  return isPast(end);
}

export function getDurationLabel(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes)) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h} hr` : `${h.toFixed(1)} hr`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "scheduled": return "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400";
    case "live": return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400";
    case "completed": return "text-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-gray-400";
    case "cancelled": return "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400";
    case "todo": return "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400";
    case "in_progress": return "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400";
    case "done": return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400";
    default: return "text-gray-600 bg-gray-50";
  }
}

export function getPriorityColor(priority: string | null): string {
  switch (priority) {
    case "high": return "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400";
    case "medium": return "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400";
    case "low": return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400";
    default: return "text-gray-600 bg-gray-50";
  }
}

export function truncate(str: string, len = 80): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}
