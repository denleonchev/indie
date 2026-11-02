import type { PublicClient } from "viem";
import type { Store } from "./store.ts";

const BLOCKS_PER_DAY = 7200;

export async function ensureStartPosition(
  store: Store,
  rpcClient: PublicClient,
) {
  if ((await store.findLastIndexedBlockNumber()) !== null) return;

  const retentionDays = await store.findRetentionDays();
  const headBlockNumber = Number(await rpcClient.getBlockNumber());
  const lastIndexedBlockNumber = headBlockNumber -
    retentionDays * BLOCKS_PER_DAY;
  const block = await rpcClient.getBlock({
    blockNumber: BigInt(lastIndexedBlockNumber),
  });

  await store.addIndexerState(
    lastIndexedBlockNumber,
    new Date(Number(block.timestamp) * 1000).toISOString(),
    block.hash,
  );
  console.log(`Start position: block ${lastIndexedBlockNumber}`);
}
