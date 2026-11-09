import "server-only";
import { createClient } from "@/lib/supabase/public";
import { getSignedInWallet } from "./auth";
import { getTokens, type Token } from "./tokens";

export type Transfer = {
  tx_hash: string;
  log_index: number;
  from_address: string;
  to_address: string;
  amount: string;
  block_time: string;
  tokens: { symbol: string; decimals: number };
};

export const FEED_PAGE_SIZE = 25;

export type TransferFilters = { ownWallet: boolean; token?: string };

export type FeedCursor = {
  direction: "before" | "after";
  blockTime: string;
  logIndex: number;
};

export type Feed = {
  transfers: Transfer[];
  hasOlder: boolean;
  hasNewer: boolean;
  isOwnWalletFilterApplied: boolean;
  token?: Token;
};

const transferColumns =
  "tx_hash, log_index, from_address, to_address, amount::text, block_time, tokens(symbol, decimals)";

export async function getTransfers(filters: TransferFilters, cursor?: FeedCursor): Promise<Feed> {
  const [signedInWallet, tokens] = await Promise.all([getSignedInWallet(), getTokens()]);
  const ownWallet = filters.ownWallet ? signedInWallet : null;
  const token = tokens.find(({ address }) => address === filters.token);

  let query = createClient().from("transfers").select(transferColumns);
  if (ownWallet) query = query.or(`from_address.eq.${ownWallet},to_address.eq.${ownWallet}`);
  if (token) query = query.eq("token", token.address);
  if (cursor) {
    const operator = cursor.direction === "before" ? "lt" : "gt";
    const { blockTime, logIndex } = cursor;
    query = query.or(
      `block_time.${operator}.${blockTime},and(block_time.eq.${blockTime},log_index.${operator}.${logIndex})`,
    );
  }
  const ascending = cursor?.direction === "after";
  const { data, error } = await query
    .order("block_time", { ascending })
    .order("log_index", { ascending })
    .limit(FEED_PAGE_SIZE + 1);
  if (error) throw new Error(`transfers select failed: ${error.message}`);

  const hasMore = data.length > FEED_PAGE_SIZE;
  const page = data.slice(0, FEED_PAGE_SIZE);
  if (ascending) page.reverse();

  return {
    transfers: page,
    hasOlder: ascending || hasMore,
    hasNewer: ascending ? hasMore : cursor !== undefined,
    isOwnWalletFilterApplied: ownWallet !== null,
    token,
  };
}
