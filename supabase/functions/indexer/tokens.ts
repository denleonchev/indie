import {
  type Address,
  BaseError,
  ContractFunctionZeroDataError,
  erc20Abi,
  type PublicClient,
} from "viem";
import type { createAdminClient } from "../_shared/db.ts";

export async function fetchTokenMetadata(
  rpcClient: PublicClient,
  address: Address,
) {
  try {
    const [symbol, decimals] = await Promise.all([
      rpcClient.readContract({
        address,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      rpcClient.readContract({
        address,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);
    return { symbol, decimals };
  } catch (error) {
    const notAToken = error instanceof BaseError &&
      error.walk((cause) => cause instanceof ContractFunctionZeroDataError);
    if (notAToken) {
      throw new Error(`Not an ERC-20 token: ${address}`, { cause: error });
    }
    throw error;
  }
}

export async function ensureTokens(
  db: ReturnType<typeof createAdminClient>,
  rpcClient: PublicClient,
  chainId: number,
  addresses: Address[],
) {
  const { data: known, error } = await db
    .from("tokens")
    .select("address")
    .eq("chain_id", chainId)
    .in("address", addresses);
  if (error) throw new Error(`tokens select failed: ${error.message}`);

  const knownAddresses = new Set(known.map((token) => token.address));
  for (const address of addresses) {
    if (knownAddresses.has(address)) continue;
    const { symbol, decimals } = await fetchTokenMetadata(rpcClient, address);
    const { error } = await db
      .from("tokens")
      .insert({ chain_id: chainId, address, symbol, decimals });
    if (error) throw new Error(`tokens insert failed: ${error.message}`);
  }
}
