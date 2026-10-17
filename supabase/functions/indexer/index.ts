import "@supabase/functions-js/edge-runtime.d.ts";
import { createPublicClient, http } from "viem";
import { isCronCall } from "../_shared/cron-auth.ts";
import { createAdminClient } from "../_shared/db.ts";
import { requireEnv } from "../_shared/env.ts";

Deno.serve(async (req) => {
  if (!(await isCronCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chainId = Number(requireEnv("CHAIN_ID"));
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("CHAIN_ID must be a positive integer");
  }
  const rpcClient = createPublicClient({
    transport: http(requireEnv("RPC_URL")),
  });

  const block = await rpcClient.getBlock({ blockTag: "latest" });
  const headBlock = Number(block.number);

  const { error } = await createAdminClient()
    .from("indexer_state")
    .upsert(
      {
        chain_id: chainId,
        head_block: headBlock,
        head_block_at: new Date(Number(block.timestamp) * 1000).toISOString(),
      },
      { onConflict: "chain_id" },
    );
  if (error) throw new Error(`indexer_state upsert failed: ${error.message}`);

  return Response.json({ chain_id: chainId, head_block: headBlock });
});
