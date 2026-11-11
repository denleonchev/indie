import {
  type Address,
  encodeAbiParameters,
  encodeEventTopics,
  erc20Abi,
  numberToHex,
} from "viem";

export type FakeTransfer = {
  blockNumber: number;
  from: Address;
  to: Address;
  value: bigint;
};

const FAKE_GENESIS_TIMESTAMP = 1_700_000_000;
const SECONDS_PER_BLOCK = 12;

export function buildFakeBlockHash(blockNumber: number) {
  return numberToHex(blockNumber, { size: 32 });
}

export function buildFakeBlockTimestamp(blockNumber: number) {
  return FAKE_GENESIS_TIMESTAMP + blockNumber * SECONDS_PER_BLOCK;
}

export function buildFakeBlock(blockNumber: number) {
  return {
    number: numberToHex(blockNumber),
    hash: buildFakeBlockHash(blockNumber),
    parentHash: buildFakeBlockHash(blockNumber - 1),
    timestamp: numberToHex(buildFakeBlockTimestamp(blockNumber)),
    transactions: [],
  };
}

export function buildFakeTransferLog(
  transfer: FakeTransfer,
  transferIndex: number,
  tokenAddress: Address,
) {
  return {
    address: tokenAddress,
    topics: encodeEventTopics({
      abi: erc20Abi,
      eventName: "Transfer",
      args: { from: transfer.from, to: transfer.to },
    }),
    data: encodeAbiParameters([{ type: "uint256" }], [transfer.value]),
    blockNumber: numberToHex(transfer.blockNumber),
    blockHash: buildFakeBlockHash(transfer.blockNumber),
    blockTimestamp: numberToHex(buildFakeBlockTimestamp(transfer.blockNumber)),
    transactionHash: numberToHex(transferIndex, { size: 32 }),
    transactionIndex: "0x0",
    logIndex: numberToHex(transferIndex),
    removed: false,
  };
}
