import "@supabase/functions-js/edge-runtime.d.ts";
import { createPublicClient, http } from "viem";
import { isCronCall } from "../_shared/cron-auth.ts";
import { createAdminClient } from "../_shared/db.ts";
import { getConfig } from "./config.ts";
import { takeLease } from "./lease.ts";
import { ensureStartPosition } from "./position.ts";
import { ensureIndexedBlocksAreCanonical } from "./reorg.ts";
import { createStore } from "./store.ts";
import { ensureTokens } from "./tokens.ts";
import { indexTransfers } from "./transfers.ts";

Deno.serve(async (req) => {
  if (!(await isCronCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const config = getConfig();
  const store = createStore(createAdminClient(), config.chainId);
  const rpcClient = createPublicClient({ transport: http(config.rpcUrl) });

  await ensureStartPosition(store, rpcClient);

  const lease = await takeLease(store, config.passSoftLimitMs);
  if (!lease) {
    return Response.json({ skipped: "another pass is running" });
  }

  try {
    await ensureTokens(store, rpcClient, config.tokenAddresses);
    const sync = await ensureIndexedBlocksAreCanonical(
      store,
      rpcClient,
      config,
    );
    if (sync) {
      console.log(
        `Reorg: synced blocks ${sync.firstSyncedBlockNumber}..${sync.lastIndexedBlockNumber}, ${sync.deletedCount} transfers deleted, ${sync.insertedCount} inserted`,
      );
    }
    const pass = await indexTransfers(store, rpcClient, config);
    console.log(
      `Read blocks ${pass.firstBlockNumberToIndex}..${pass.lastIndexedBlockNumber} of ${pass.lastConfirmedBlockNumber} confirmed (head ${pass.headBlockNumber}), ${pass.transferCount} transfers`,
    );
    return Response.json({ sync, pass });
  } finally {
    await store.releaseLease(lease);
  }
});
