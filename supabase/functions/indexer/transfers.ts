import { parseAbiItem, type PublicClient } from "viem";
import type { Config } from "./config.ts";
import type { Store, TransferRow } from "./store.ts";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export async function readTransfers(
  store: Store,
  rpcClient: PublicClient,
  { tokenAddresses, rangeSize, passSoftLimitMs, maxTransfersPerPass }: Config,
) {
  const startedAt = Date.now();

  const startBlock = await store.findLastBlock();
  if (startBlock === null) throw new Error("No indexer position yet");

  const head = Number(await rpcClient.getBlockNumber());
  let lastBlock = startBlock;
  let transferCount = 0;
  const firstBlock = lastBlock + 1;

  while (
    lastBlock < head &&
    transferCount < maxTransfersPerPass &&
    Date.now() - startedAt < passSoftLimitMs
  ) {
    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(head, fromBlock + rangeSize - 1);

    const [logs, block] = await Promise.all([
      rpcClient.getLogs({
        address: tokenAddresses,
        event: transferEvent,
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
        strict: true,
      }),
      rpcClient.getBlock({ blockNumber: BigInt(toBlock) }),
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

    await store.savePass(
      fromBlock,
      toBlock,
      new Date(Number(block.timestamp) * 1000).toISOString(),
      rows,
    );

    lastBlock = toBlock;
    transferCount += rows.length;
  }

  return { firstBlock, lastBlock, head, transferCount };
}
