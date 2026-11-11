import { expect } from "@std/expect";
import type { Config } from "./config.ts";
import { createFakeRpcClient } from "./fake-rpc-client.ts";
import { createFakeStore } from "./fake-store.ts";
import { indexTransfers } from "./transfers.ts";

const config: Config = {
  chainId: 1,
  rpcUrl: "http://fake",
  tokenAddresses: ["0x1111111111111111111111111111111111111111"],
  confirmations: 0,
  rangeSize: 100,
  passSoftLimitMs: 60_000,
  maxTransfersPerPass: 1000,
};

Deno.test("indexTransfers moves the position up to the head", async () => {
  const store = createFakeStore({
    position: { blockNumber: 100, blockTime: "", blockHash: "0x100" },
  });
  const rpcClient = createFakeRpcClient({ headBlockNumber: 110 });

  await indexTransfers(store, rpcClient, config);

  expect(await store.findLastIndexedBlockNumber()).toBe(110);
});
