import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/public";

export type Token = { address: string; symbol: string };

export const getTokens = cache(async (): Promise<Token[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from("tokens").select("address, symbol").order("symbol");
  if (error) throw new Error(`tokens select failed: ${error.message}`);
  return data;
});
