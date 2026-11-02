import { type Address, isAddress } from "viem";
import { requireEnv } from "../_shared/env.ts";

function requireInteger(name: string, min: number): number {
  const value = Number(requireEnv(name));
  if (!Number.isSafeInteger(value) || value < min) {
    throw new Error(`${name} must be an integer of at least ${min}`);
  }
  return value;
}

export const getConfig = () => {
  const tokenAddresses = requireEnv("TOKEN_ADDRESSES")
    .split(",")
    .map((address) => address.trim().toLowerCase());
  for (const address of tokenAddresses) {
    if (!isAddress(address)) {
      throw new Error(`Not an address in TOKEN_ADDRESSES: ${address}`);
    }
  }

  return {
    chainId: requireInteger("CHAIN_ID", 1),
    rpcUrl: requireEnv("RPC_URL"),
    tokenAddresses: tokenAddresses as Address[],
    confirmations: requireInteger("CONFIRMATIONS", 0),
    rangeSize: requireInteger("RANGE_SIZE", 1),
    passSoftLimitMs: requireInteger("PASS_SOFT_LIMIT_MS", 1),
    maxTransfersPerPass: requireInteger("MAX_TRANSFERS_PER_PASS", 1),
  };
};

export type Config = ReturnType<typeof getConfig>;
