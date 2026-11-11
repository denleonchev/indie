import {
  createPublicClient,
  custom,
  type Hex,
  hexToNumber,
  numberToHex,
} from "viem";

export class SimulatedRpcError extends Error {
  override name = "SimulatedRpcError";
}

type FakeRpcClientOptions = {
  headBlockNumber: number;
  failGetLogsOnNthCall?: number;
};

function buildFakeBlockHash(blockNumber: number) {
  return numberToHex(blockNumber, { size: 32 });
}

const FAKE_GENESIS_TIMESTAMP = 1_700_000_000;
const SECONDS_PER_BLOCK = 12;

function buildFakeBlockTimestamp(blockNumber: number) {
  return FAKE_GENESIS_TIMESTAMP + blockNumber * SECONDS_PER_BLOCK;
}

export function createFakeRpcClient(options: FakeRpcClientOptions) {
  function getBlockByNumber(blockNumberHex: Hex) {
    const blockNumber = hexToNumber(blockNumberHex);
    if (blockNumber > options.headBlockNumber) return null;
    return {
      number: blockNumberHex,
      hash: buildFakeBlockHash(blockNumber),
      parentHash: buildFakeBlockHash(blockNumber - 1),
      timestamp: numberToHex(buildFakeBlockTimestamp(blockNumber)),
      transactions: [],
    };
  }

  let getLogsCallCount = 0;

  function getLogs() {
    getLogsCallCount += 1;
    if (getLogsCallCount === options.failGetLogsOnNthCall) {
      throw new SimulatedRpcError("eth_getLogs");
    }
    return [];
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
              return getLogs();
            default:
              throw new Error(`unexpected RPC: ${method}`);
          }
        },
      },
      { retryCount: 0 },
    ),
  });
}
