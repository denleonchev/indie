import { type Address, isAddress } from "viem";
import { requireEnv } from "../_shared/env.ts";

function requirePositiveInteger(name: string): number {
  const value = Number(requireEnv(name));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
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
    chainId: requirePositiveInteger("CHAIN_ID"),
    rpcUrl: requireEnv("RPC_URL"),
    tokenAddresses: tokenAddresses as Address[],
    rangeSize: requirePositiveInteger("RANGE_SIZE"),
    passSoftLimitMs: requirePositiveInteger("PASS_SOFT_LIMIT_MS"),
    maxTransfersPerPass: requirePositiveInteger("MAX_TRANSFERS_PER_PASS"),
  };
};

export type Config = ReturnType<typeof getConfig>;
