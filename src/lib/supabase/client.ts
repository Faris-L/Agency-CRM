import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseKey());
}
