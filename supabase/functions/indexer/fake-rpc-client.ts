import {
  type Address,
  createPublicClient,
  custom,
  type Hex,
  hexToNumber,
  numberToHex,
} from "viem";
import {
  buildFakeBlock,
  buildFakeTransferLog,
  type FakeTransfer,
} from "./fake-chain.ts";

export class SimulatedRpcError extends Error {
  override name = "SimulatedRpcError";
}

type FakeRpcClientOptions = {
  headBlockNumber: number;
  finalizedBlockNumber?: number;
  transfers?: FakeTransfer[];
  failGetLogsOnNthCall?: number;
};

type LogFilter = { address: Address[]; fromBlock: Hex; toBlock: Hex };

export function createFakeRpcClient(options: FakeRpcClientOptions) {
  function findBlockNumber(blockNumberOrTag: Hex | "finalized") {
    if (blockNumberOrTag !== "finalized") return hexToNumber(blockNumberOrTag);
    if (options.finalizedBlockNumber === undefined) {
      throw new Error("finalizedBlockNumber is not set");
    }
    return options.finalizedBlockNumber;
  }

  function getBlockByNumber(blockNumberOrTag: Hex | "finalized") {
    const blockNumber = findBlockNumber(blockNumberOrTag);
    if (blockNumber > options.headBlockNumber) return null;
    return buildFakeBlock(blockNumber);
  }

  let getLogsCallCount = 0;

  function getLogs({ address, fromBlock, toBlock }: LogFilter) {
    getLogsCallCount += 1;
    if (getLogsCallCount === options.failGetLogsOnNthCall) {
      throw new SimulatedRpcError("eth_getLogs");
    }

    const fromBlockNumber = hexToNumber(fromBlock);
    const toBlockNumber = hexToNumber(toBlock);
    return (options.transfers ?? [])
      .map((transfer, transferIndex) =>
        buildFakeTransferLog(transfer, transferIndex, address[0])
      )
      .filter((log) => {
        const blockNumber = hexToNumber(log.blockNumber);
        return blockNumber >= fromBlockNumber && blockNumber <= toBlockNumber;
      });
  }

  return createPublicClient({
    transport: custom(
      {
        // deno-lint-ignore require-await
        async request({ method, params }) {
          switch (method) {
            case "eth_blockNumber":
              return numberToHex(options.headBlockNumber);
            case "eth_getBlockByNumber":
              return getBlockByNumber(params[0]);
            case "eth_getLogs":
              return getLogs(params[0]);
            default:
              throw new Error(`unexpected RPC: ${method}`);
          }
        },
      },
      { retryCount: 0 },
    ),
  });
}
