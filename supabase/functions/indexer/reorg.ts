import type { PublicClient } from "viem";
import type { Store } from "./store.ts";

export async function checkLastIndexedBlock(
  store: Store,
  rpcClient: PublicClient,
) {
  const lastIndexedBlockNumber = await store.findLastIndexedBlockNumber();
  const lastIndexedBlockHash = await store.findLastIndexedBlockHash();
  if (lastIndexedBlockNumber === null || lastIndexedBlockHash === null) return;

  const chainBlock = await rpcClient.getBlock({
    blockNumber: BigInt(lastIndexedBlockNumber),
  });
  if (chainBlock.hash !== lastIndexedBlockHash) {
    throw new Error(
      `Block ${lastIndexedBlockNumber} was replaced: stored ${lastIndexedBlockHash}, chain has ${chainBlock.hash}`,
    );
  }
}
