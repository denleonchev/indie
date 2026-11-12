import { expect } from "@std/expect";
import { fakeConfig } from "./fake-config.ts";
import { buildFakeBlockHash } from "./fake-chain.ts";
import { createFakeRpcClient } from "./fake-rpc-client.ts";
import { createFakeStore } from "./fake-store.ts";
import { ensureIndexedBlocksAreCanonical } from "./reorg.ts";

const ALICE = "0x00000000000000000000000000000000000000a1";
const BOB = "0x00000000000000000000000000000000000000b2";
const STALE_BLOCK_HASH = `0x${"ab".repeat(32)}`;

Deno.test("ensureIndexedBlocksAreCanonical does nothing when the position hash matches the chain", async () => {
  const lastIndexedBlockNumber = 110;
  const store = createFakeStore({
    position: {
      blockNumber: lastIndexedBlockNumber,
      blockTime: "",
      blockHash: buildFakeBlockHash(lastIndexedBlockNumber),
    },
  });
  const rpcClient = createFakeRpcClient({
    headBlockNumber: lastIndexedBlockNumber + 1,
  });

  expect(await ensureIndexedBlocksAreCanonical(store, rpcClient, fakeConfig))
    .toBeNull();

  expect(await store.findLastIndexedBlockHash()).toBe(
    buildFakeBlockHash(lastIndexedBlockNumber),
  );
  expect(store.syncUnfinalizedRange).not.toHaveBeenCalled();
});

Deno.test("ensureIndexedBlocksAreCanonical rereads the blocks above finalized after a reorg", async () => {
  const lastIndexedBlockNumber = 110;
  const finalizedBlockNumber = lastIndexedBlockNumber - 5;
  const store = createFakeStore({
    position: {
      blockNumber: lastIndexedBlockNumber,
      blockTime: "",
      blockHash: STALE_BLOCK_HASH,
    },
  });
  const rpcClient = createFakeRpcClient({
    headBlockNumber: lastIndexedBlockNumber + 1,
    finalizedBlockNumber,
    transfers: [
      { blockNumber: finalizedBlockNumber, from: ALICE, to: BOB, value: 1n },
      {
        blockNumber: finalizedBlockNumber + 2,
        from: ALICE,
        to: BOB,
        value: 5n,
      },
    ],
  });

  await ensureIndexedBlocksAreCanonical(store, rpcClient, {
    ...fakeConfig,
    rangeSize: 2,
  });

  expect(await store.findLastIndexedBlockHash()).toBe(
    buildFakeBlockHash(lastIndexedBlockNumber),
  );
  expect(store.syncUnfinalizedRange).toHaveBeenCalledWith(
    finalizedBlockNumber,
    lastIndexedBlockNumber,
    STALE_BLOCK_HASH,
    buildFakeBlockHash(lastIndexedBlockNumber),
    expect.any(String),
    [
      expect.objectContaining({
        block_number: finalizedBlockNumber + 2,
        amount: "5",
      }),
    ],
  );
});

Deno.test("ensureIndexedBlocksAreCanonical stops when a final block was replaced", async () => {
  const lastIndexedBlockNumber = 110;
  const store = createFakeStore({
    position: {
      blockNumber: lastIndexedBlockNumber,
      blockTime: "",
      blockHash: STALE_BLOCK_HASH,
    },
  });
  const rpcClient = createFakeRpcClient({
    headBlockNumber: lastIndexedBlockNumber + 1,
    finalizedBlockNumber: lastIndexedBlockNumber,
  });

  await expect(ensureIndexedBlocksAreCanonical(store, rpcClient, fakeConfig))
    .rejects
    .toThrow(`Final block ${lastIndexedBlockNumber} was replaced`);

  expect(await store.findLastIndexedBlockHash()).toBe(STALE_BLOCK_HASH);
  expect(store.syncUnfinalizedRange).not.toHaveBeenCalled();
});
