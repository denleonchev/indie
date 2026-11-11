import type { Config } from "./config.ts";

export const fakeConfig: Config = {
  chainId: 1,
  rpcUrl: "http://fake",
  tokenAddresses: ["0x1111111111111111111111111111111111111111"],
  confirmations: 0,
  rangeSize: 100,
  passSoftLimitMs: 60_000,
  maxTransfersPerPass: 1000,
};
