import {
  createPublicClient,
  custom,
  type Hex,
  hexToNumber,
  numberToHex,
} from "viem";

type FakeRpcClientOptions = { headBlockNumber: number };

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
              return [];
            default:
              throw new Error(`unexpected RPC: ${method}`);
          }
        },
      },
      { retryCount: 0 },
    ),
  });
}
