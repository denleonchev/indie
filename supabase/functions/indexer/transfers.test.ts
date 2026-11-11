import { expect } from "@std/expect";
import { fakeConfig } from "./fake-config.ts";
import { createFakeRpcClient, SimulatedRpcError } from "./fake-rpc-client.ts";
import { createFakeStore } from "./fake-store.ts";
import { indexTransfers } from "./transfers.ts";

Deno.test("indexTransfers moves the position up to the head", async () => {
  const store = createFakeStore({
    position: { blockNumber: 100, blockTime: "", blockHash: "0x100" },
  });
  const rpcClient = createFakeRpcClient({ headBlockNumber: 110 });

  await indexTransfers(store, rpcClient, fakeConfig);

  expect(await store.findLastIndexedBlockNumber()).toBe(110);
});

Deno.test("indexTransfers resumes after a pass fails in the middle", async () => {
  const store = createFakeStore({
    position: { blockNumber: 100, blockTime: "", blockHash: "0x100" },
  });
  const passConfig = { ...fakeConfig, rangeSize: 5 };

  await expect(
    indexTransfers(
      store,
      createFakeRpcClient({ headBlockNumber: 110, failGetLogsOnNthCall: 2 }),
      passConfig,
    ),
  ).rejects.toMatchObject({ cause: expect.any(SimulatedRpcError) });
  expect(await store.findLastIndexedBlockNumber()).toBe(105);

  await indexTransfers(
    store,
    createFakeRpcClient({ headBlockNumber: 110 }),
    passConfig,
  );
  expect(await store.findLastIndexedBlockNumber()).toBe(110);
});
