import type { createAdminClient } from "../_shared/db.ts";

export type TransferRow = {
  tx_hash: string;
  log_index: number;
  token: string;
  from_address: string;
  to_address: string;
  amount: string;
  block_number: number;
  block_hash: string;
  block_time: string;
};

export interface Store {
  findKnownTokens(addresses: string[]): Promise<Set<string>>;
  addToken(address: string, symbol: string, decimals: number): Promise<void>;
  findLastBlock(): Promise<number | null>;
  createPosition(lastBlock: number, lastBlockAt: string): Promise<void>;
  findRetentionDays(): Promise<number>;
  takeLease(leaseUntil: string, now: string): Promise<boolean>;
  releaseLease(leaseUntil: string): Promise<void>;
  savePass(
    fromBlock: number,
    toBlock: number,
    toBlockAt: string,
    transfers: TransferRow[],
  ): Promise<void>;
}

export function createStore(
  db: ReturnType<typeof createAdminClient>,
  chainId: number,
): Store {
  return {
    async findKnownTokens(addresses: string[]) {
      const { data, error } = await db
        .from("tokens")
        .select("address")
        .eq("chain_id", chainId)
        .in("address", addresses);
      if (error) throw new Error(`tokens select failed: ${error.message}`);
      return new Set(data.map((token) => token.address));
    },

    async addToken(address: string, symbol: string, decimals: number) {
      const { error } = await db
        .from("tokens")
        .insert({ chain_id: chainId, address, symbol, decimals });
      if (error) throw new Error(`tokens insert failed: ${error.message}`);
    },

    async findLastBlock() {
      const { data, error } = await db
        .from("indexer_state")
        .select("last_block")
        .eq("chain_id", chainId)
        .maybeSingle();
      if (error) {
        throw new Error(`indexer_state select failed: ${error.message}`);
      }
      return data?.last_block ?? null;
    },

    async createPosition(lastBlock: number, lastBlockAt: string) {
      const { error } = await db.from("indexer_state").upsert(
        {
          chain_id: chainId,
          last_block: lastBlock,
          last_block_at: lastBlockAt,
        },
        { onConflict: "chain_id", ignoreDuplicates: true },
      );
      if (error) {
        throw new Error(`indexer_state insert failed: ${error.message}`);
      }
    },

    async findRetentionDays() {
      const { data, error } = await db
        .from("settings")
        .select("retention_days")
        .single();
      if (error) throw new Error(`settings select failed: ${error.message}`);
      return data.retention_days;
    },

    async takeLease(leaseUntil: string, now: string) {
      const { data, error } = await db
        .from("indexer_state")
        .update({ lease_until: leaseUntil })
        .eq("chain_id", chainId)
        .or(`lease_until.is.null,lease_until.lt.${now}`)
        .select("chain_id");
      if (error) throw new Error(`lease take failed: ${error.message}`);
      return data.length > 0;
    },

    async releaseLease(leaseUntil: string) {
      const { error } = await db
        .from("indexer_state")
        .update({ lease_until: null })
        .eq("chain_id", chainId)
        .eq("lease_until", leaseUntil);
      if (error) throw new Error(`lease release failed: ${error.message}`);
    },

    async savePass(
      fromBlock: number,
      toBlock: number,
      toBlockAt: string,
      transfers: TransferRow[],
    ) {
      const { error } = await db.rpc("save_pass", {
        p_chain_id: chainId,
        p_from_block: fromBlock,
        p_to_block: toBlock,
        p_to_block_at: toBlockAt,
        p_transfers: transfers,
      });
      if (error) throw new Error(`save_pass failed: ${error.message}`);
    },
  };
}
