import { parseAbiItem, type PublicClient } from "viem";
import type { Config } from "./config.ts";
import type { Store, TransferRow } from "./store.ts";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export async function indexTransfers(
  store: Store,
  rpcClient: PublicClient,
  {
    tokenAddresses,
    confirmations,
    rangeSize,
    passSoftLimitMs,
    maxTransfersPerPass,
  }: Config,
) {
  const passStartedAt = Date.now();

  let lastIndexedBlockNumber = await store.findLastIndexedBlockNumber();
  if (lastIndexedBlockNumber === null) {
    throw new Error("No indexer position yet");
  }

  const headBlockNumber = Number(await rpcClient.getBlockNumber());
  const lastConfirmedBlockNumber = headBlockNumber - confirmations;
  let transferCount = 0;
  const firstBlockNumberToIndex = lastIndexedBlockNumber + 1;

  while (
    lastIndexedBlockNumber < lastConfirmedBlockNumber &&
    transferCount < maxTransfersPerPass &&
    Date.now() - passStartedAt < passSoftLimitMs
  ) {
    const fromBlockNumber = lastIndexedBlockNumber + 1;
    const toBlockNumber = Math.min(
      lastConfirmedBlockNumber,
      fromBlockNumber + rangeSize - 1,
    );

    const [logs, block] = await Promise.all([
      rpcClient.getLogs({
        address: tokenAddresses,
        event: transferEvent,
        fromBlock: BigInt(fromBlockNumber),
        toBlock: BigInt(toBlockNumber),
        strict: true,
      }),
      rpcClient.getBlock({ blockNumber: BigInt(toBlockNumber) }),
    ]);

    const rows: TransferRow[] = logs.map((log) => ({
      tx_hash: log.transactionHash,
      log_index: log.logIndex,
      token: log.address.toLowerCase(),
      from_address: log.args.from.toLowerCase(),
      to_address: log.args.to.toLowerCase(),
      amount: log.args.value.toString(),
      block_number: Number(log.blockNumber),
      block_hash: log.blockHash,
      block_time: new Date(Number(log.blockTimestamp) * 1000).toISOString(),
    }));

    await store.saveIndexedRange(
      fromBlockNumber,
      toBlockNumber,
      new Date(Number(block.timestamp) * 1000).toISOString(),
      rows,
    );

    lastIndexedBlockNumber = toBlockNumber;
    transferCount += rows.length;
  }

  return {
    firstBlockNumberToIndex,
    lastIndexedBlockNumber,
    lastConfirmedBlockNumber,
    headBlockNumber,
    transferCount,
  };
}
