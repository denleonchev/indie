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

export type TransferFilters = { ownWallet: boolean; token?: string };

export type Feed = {
  transfers: Transfer[];
  isOwnWalletFilterApplied: boolean;
  token?: Token;
};

const transferColumns =
  "tx_hash, log_index, from_address, to_address, amount::text, block_time, tokens(symbol, decimals)";

export async function getTransfers(filters: TransferFilters): Promise<Feed> {
  const [signedInWallet, tokens] = await Promise.all([getSignedInWallet(), getTokens()]);
  const ownWallet = filters.ownWallet ? signedInWallet : null;
  const token = tokens.find(({ address }) => address === filters.token);

  let query = createClient().from("transfers").select(transferColumns);
  if (ownWallet) query = query.or(`from_address.eq.${ownWallet},to_address.eq.${ownWallet}`);
  if (token) query = query.eq("token", token.address);
  const { data, error } = await query
    .order("block_time", { ascending: false })
    .order("log_index", { ascending: false })
    .limit(50);
  if (error) throw new Error(`transfers select failed: ${error.message}`);

  return { transfers: data, isOwnWalletFilterApplied: ownWallet !== null, token };
}
