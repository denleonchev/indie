import type { PublicClient } from "viem";
import type { Config } from "./config.ts";
import type { Store, TransferRow } from "./store.ts";
import { fetchTransfers } from "./transfers.ts";

export async function ensureIndexedBlocksAreCanonical(
  store: Store,
  rpcClient: PublicClient,
  { tokenAddresses, rangeSize }: Config,
) {
  const lastIndexedBlockNumber = await store.findLastIndexedBlockNumber();
  const lastIndexedBlockHash = await store.findLastIndexedBlockHash();
  if (lastIndexedBlockNumber === null || lastIndexedBlockHash === null) {
    return null;
  }

  const chainBlock = await rpcClient.getBlock({
    blockNumber: BigInt(lastIndexedBlockNumber),
  });
  if (chainBlock.hash === lastIndexedBlockHash) return null;

  const finalizedBlockNumber = Number(
    (await rpcClient.getBlock({ blockTag: "finalized" })).number,
  );
  if (lastIndexedBlockNumber <= finalizedBlockNumber) {
    throw new Error(
      `Final block ${lastIndexedBlockNumber} was replaced: stored ${lastIndexedBlockHash}, chain has ${chainBlock.hash}`,
    );
  }

  const transfers: TransferRow[] = [];
  for (
    let fromBlockNumber = finalizedBlockNumber + 1;
    fromBlockNumber <= lastIndexedBlockNumber;
    fromBlockNumber += rangeSize
  ) {
    const toBlockNumber = Math.min(
      lastIndexedBlockNumber,
      fromBlockNumber + rangeSize - 1,
    );
    transfers.push(
      ...(await fetchTransfers(
        rpcClient,
        tokenAddresses,
        fromBlockNumber,
        toBlockNumber,
      )),
    );
  }

  const { deletedCount, insertedCount } = await store.syncUnfinalizedRange(
    finalizedBlockNumber,
    lastIndexedBlockNumber,
    lastIndexedBlockHash,
    chainBlock.hash,
    new Date(Number(chainBlock.timestamp) * 1000).toISOString(),
    transfers,
  );

  return {
    firstSyncedBlockNumber: finalizedBlockNumber + 1,
    lastIndexedBlockNumber,
    deletedCount,
    insertedCount,
  };
}
