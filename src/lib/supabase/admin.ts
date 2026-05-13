import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database";

// Bypasses RLS — server-side only, never expose to client
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
