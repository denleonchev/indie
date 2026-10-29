import type { PublicClient } from "viem";
import type { createAdminClient } from "../_shared/db.ts";

const BLOCKS_PER_DAY = 7200n;

export async function ensureStartPosition(
  db: ReturnType<typeof createAdminClient>,
  rpcClient: PublicClient,
  chainId: number,
) {
  const { data: state, error: stateError } = await db
    .from("indexer_state")
    .select("chain_id")
    .eq("chain_id", chainId)
    .maybeSingle();
  if (stateError) {
    throw new Error(`indexer_state select failed: ${stateError.message}`);
  }
  if (state) return;

  const { data: settings, error: settingsError } = await db
    .from("settings")
    .select("retention_days")
    .single();
  if (settingsError) {
    throw new Error(`settings select failed: ${settingsError.message}`);
  }

  const head = await rpcClient.getBlockNumber();
  const lastBlock = head - BigInt(settings.retention_days) * BLOCKS_PER_DAY;
  const block = await rpcClient.getBlock({ blockNumber: lastBlock });

  const { error } = await db.from("indexer_state").upsert(
    {
      chain_id: chainId,
      last_block: Number(lastBlock),
      last_block_at: new Date(Number(block.timestamp) * 1000).toISOString(),
    },
    { onConflict: "chain_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(`indexer_state insert failed: ${error.message}`);
  console.log(`Start position: block ${lastBlock}`);
}
