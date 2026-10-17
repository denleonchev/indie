import { createClient } from "@supabase/supabase-js";
import type { Database } from "./.generated/database.types.ts";
import { requireEnv } from "./env.ts";

export function createAdminClient() {
  const secretKeys = JSON.parse(requireEnv("SUPABASE_SECRET_KEYS"));
  return createClient<Database>(requireEnv("SUPABASE_URL"), secretKeys.default);
}
