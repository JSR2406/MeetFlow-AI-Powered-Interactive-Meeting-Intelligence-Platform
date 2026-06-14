/**
 * Supabase type helper to work around strict TypeScript inference issues
 * with @supabase/supabase-js when Database generic is complex.
 * 
 * Usage: sb(supabase).from("table_name")
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sb(client: SupabaseClient<Database>): any {
  return client;
}
