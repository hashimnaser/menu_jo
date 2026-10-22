import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createSupabaseClient<Database>(url, anonKey);
}
