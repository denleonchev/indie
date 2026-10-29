import { parseAbiItem, type PublicClient } from "viem";
import type { createAdminClient } from "../_shared/db.ts";
import type { Config } from "./config.ts";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export async function readTransfers(
  db: ReturnType<typeof createAdminClient>,
  rpcClient: PublicClient,
  { chainId, tokenAddresses, rangeSize, passSoftLimitMs, maxTransfersPerPass }:
    Config,
) {
  const startedAt = Date.now();

  const { data: state, error } = await db
    .from("indexer_state")
    .select("last_block")
    .eq("chain_id", chainId)
    .single();
  if (error) throw new Error(`indexer_state select failed: ${error.message}`);

  const head = Number(await rpcClient.getBlockNumber());
  let lastBlock = state.last_block;
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

    const rows = logs.map((log) => ({
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

    const { error } = await db.rpc("save_pass", {
      p_chain_id: chainId,
      p_from_block: fromBlock,
      p_to_block: toBlock,
      p_to_block_at: new Date(Number(block.timestamp) * 1000).toISOString(),
      p_transfers: rows,
    });
    if (error) throw new Error(`save_pass failed: ${error.message}`);

    lastBlock = toBlock;
    transferCount += rows.length;
  }

  return { firstBlock, lastBlock, head, transferCount };
}
