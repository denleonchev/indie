import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/public";

export const getRetentionDays = cache(async (): Promise<number> => {
  const { data, error } = await createClient().from("settings").select("retention_days").single();
  if (error) throw new Error(`settings select failed: ${error.message}`);
  return data.retention_days;
});
