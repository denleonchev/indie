import { createPublicClient, custom, hexToNumber, numberToHex } from "viem";

type FakeChain = { headBlockNumber: number };

function buildBlockHash(blockNumber: number) {
  return numberToHex(blockNumber, { size: 32 });
}

function buildBlockTimestamp(blockNumber: number) {
  return 1_700_000_000 + blockNumber * 12;
}

export function createFakeRpcClient(chain: FakeChain) {
  function getBlockByNumber(blockNumberHex: `0x${string}`) {
    const blockNumber = hexToNumber(blockNumberHex);
    if (blockNumber > chain.headBlockNumber) return null;
    return {
      number: blockNumberHex,
      hash: buildBlockHash(blockNumber),
      parentHash: buildBlockHash(blockNumber - 1),
      timestamp: numberToHex(buildBlockTimestamp(blockNumber)),
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
              return numberToHex(chain.headBlockNumber);
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
