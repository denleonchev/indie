import {
  type Address,
  BaseError,
  ContractFunctionZeroDataError,
  erc20Abi,
  type PublicClient,
} from "viem";
import type { Store } from "./store.ts";

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
  store: Store,
  rpcClient: PublicClient,
  addresses: Address[],
) {
  const known = await store.findKnownTokens(addresses);
  for (const address of addresses) {
    if (known.has(address)) continue;
    const { symbol, decimals } = await fetchTokenMetadata(rpcClient, address);
    await store.addToken(address, symbol, decimals);
  }
}
