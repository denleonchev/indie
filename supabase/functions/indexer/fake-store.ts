import { fn } from "@std/expect";
import type { Store } from "./store.ts";

type FakeState = {
  position:
    | { blockNumber: number; blockTime: string; blockHash: string }
    | null;
};

function notFaked(name: string) {
  return () => {
    throw new Error(`not faked: ${name}`);
  };
}

export function createFakeStore(initial: Partial<FakeState> = {}) {
  const state: FakeState = { position: null, ...initial };

  const syncUnfinalizedRange: Store["syncUnfinalizedRange"] = (
    _finalizedBlockNumber,
    _lastIndexedBlockNumber,
    _storedBlockHash,
    chainBlockHash,
    chainBlockTime,
  ) => {
    if (state.position) {
      state.position = {
        ...state.position,
        blockHash: chainBlockHash,
        blockTime: chainBlockTime,
      };
    }
    return Promise.resolve({ deletedCount: 0, insertedCount: 0 });
  };

  const store: Store = {
    findLastIndexedBlockNumber() {
      return Promise.resolve(state.position?.blockNumber ?? null);
    },

    findLastIndexedBlockHash() {
      return Promise.resolve(state.position?.blockHash ?? null);
    },

    saveIndexedRange(
      _fromBlockNumber,
      toBlockNumber,
      toBlockTime,
      toBlockHash,
    ) {
      state.position = {
        blockNumber: toBlockNumber,
        blockTime: toBlockTime,
        blockHash: toBlockHash,
      };
      return Promise.resolve();
    },

    findKnownTokens: notFaked("findKnownTokens"),
    addToken: notFaked("addToken"),
    addIndexerState: notFaked("addIndexerState"),
    findRetentionDays: notFaked("findRetentionDays"),
    takeLease: notFaked("takeLease"),
    releaseLease: notFaked("releaseLease"),
    syncUnfinalizedRange: fn(syncUnfinalizedRange) as Store[
      "syncUnfinalizedRange"
    ],
  };

  return store;
}
