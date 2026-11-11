import { expect } from "@std/expect";
import { fakeConfig } from "./fake-config.ts";
import { buildFakeBlockHash, type FakeTransfer } from "./fake-chain.ts";
import { createFakeRpcClient } from "./fake-rpc-client.ts";
import { createFakeStore } from "./fake-store.ts";
import { ensureIndexedBlocksAreCanonical } from "./reorg.ts";

const ALICE = "0x00000000000000000000000000000000000000a1";
const BOB = "0x00000000000000000000000000000000000000b2";
const STALE_BLOCK_HASH = `0x${"ab".repeat(32)}`;

const transfers: FakeTransfer[] = [
  { blockNumber: 105, from: ALICE, to: BOB, value: 1n },
  { blockNumber: 107, from: ALICE, to: BOB, value: 5n },
];

Deno.test("ensureIndexedBlocksAreCanonical does nothing when the position hash matches the chain", async () => {
  const store = createFakeStore({
    position: {
      blockNumber: 110,
      blockTime: "",
      blockHash: buildFakeBlockHash(110),
    },
  });
  const rpcClient = createFakeRpcClient({ headBlockNumber: 115 });

  expect(await ensureIndexedBlocksAreCanonical(store, rpcClient, fakeConfig))
    .toBeNull();

  expect(await store.findLastIndexedBlockHash()).toBe(buildFakeBlockHash(110));
  expect(store.syncUnfinalizedRange).not.toHaveBeenCalled();
});

Deno.test("ensureIndexedBlocksAreCanonical rereads the blocks above finalized after a reorg", async () => {
  const store = createFakeStore({
    position: { blockNumber: 110, blockTime: "", blockHash: STALE_BLOCK_HASH },
  });
  const rpcClient = createFakeRpcClient({
    headBlockNumber: 115,
    finalizedBlockNumber: 105,
    transfers,
  });

  await ensureIndexedBlocksAreCanonical(store, rpcClient, {
    ...fakeConfig,
    rangeSize: 2,
  });

  expect(await store.findLastIndexedBlockHash()).toBe(buildFakeBlockHash(110));
  expect(store.syncUnfinalizedRange).toHaveBeenCalledWith(
    105,
    110,
    STALE_BLOCK_HASH,
    buildFakeBlockHash(110),
    expect.any(String),
    [expect.objectContaining({ block_number: 107, amount: "5" })],
  );
});

Deno.test("ensureIndexedBlocksAreCanonical stops when a final block was replaced", async () => {
  const store = createFakeStore({
    position: { blockNumber: 110, blockTime: "", blockHash: STALE_BLOCK_HASH },
  });
  const rpcClient = createFakeRpcClient({
    headBlockNumber: 115,
    finalizedBlockNumber: 110,
    transfers,
  });

  await expect(ensureIndexedBlocksAreCanonical(store, rpcClient, fakeConfig))
    .rejects
    .toThrow("Final block 110 was replaced");

  expect(await store.findLastIndexedBlockHash()).toBe(STALE_BLOCK_HASH);
  expect(store.syncUnfinalizedRange).not.toHaveBeenCalled();
});
