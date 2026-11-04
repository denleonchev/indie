import "server-only";
import { createClient } from "@/lib/supabase/public";

export type IndexerStatus = { lastBlock: number; lastBlockAt: string };

export async function getIndexerStatus(): Promise<IndexerStatus | null> {
  const { data, error } = await createClient()
    .from("indexer_state")
    .select("last_block, last_block_at")
    .maybeSingle();
  if (error) throw new Error(`indexer_state select failed: ${error.message}`);
  return data ? { lastBlock: data.last_block, lastBlockAt: data.last_block_at } : null;
}
