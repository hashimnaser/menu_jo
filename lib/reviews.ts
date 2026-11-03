import type { Database } from "@/types/supabase";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
