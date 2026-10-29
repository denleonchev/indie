import type { createAdminClient } from "../_shared/db.ts";
import type { Config } from "./config.ts";

export async function takeLease(
  db: ReturnType<typeof createAdminClient>,
  { chainId, passSoftLimitMs }: Config,
) {
  const now = new Date();
  const leaseDurationMs = passSoftLimitMs * 3;
  const leaseUntil = new Date(now.getTime() + leaseDurationMs).toISOString();
  const { data, error } = await db
    .from("indexer_state")
    .update({ lease_until: leaseUntil })
    .eq("chain_id", chainId)
    .or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`)
    .select("chain_id");
  if (error) throw new Error(`lease take failed: ${error.message}`);
  return data.length > 0 ? leaseUntil : null;
}

export async function releaseLease(
  db: ReturnType<typeof createAdminClient>,
  chainId: number,
  leaseUntil: string,
) {
  const { error } = await db
    .from("indexer_state")
    .update({ lease_until: null })
    .eq("chain_id", chainId)
    .eq("lease_until", leaseUntil);
  if (error) throw new Error(`lease release failed: ${error.message}`);
}
