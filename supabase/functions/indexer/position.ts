import type { PublicClient } from "viem";
import type { Store } from "./store.ts";

const BLOCKS_PER_DAY = 7200n;

export async function ensureStartPosition(
  store: Store,
  rpcClient: PublicClient,
) {
  if ((await store.findLastBlock()) !== null) return;

  const retentionDays = await store.findRetentionDays();
  const head = await rpcClient.getBlockNumber();
  const lastBlock = head - BigInt(retentionDays) * BLOCKS_PER_DAY;
  const block = await rpcClient.getBlock({ blockNumber: lastBlock });

  await store.createPosition(
    Number(lastBlock),
    new Date(Number(block.timestamp) * 1000).toISOString(),
  );
  console.log(`Start position: block ${lastBlock}`);
}
