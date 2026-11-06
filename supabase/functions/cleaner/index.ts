import "@supabase/functions-js/edge-runtime.d.ts";
import { isCronCall } from "../_shared/cron-auth.ts";
import { createAdminClient } from "../_shared/db.ts";
import {
  deleteExportRows,
  findOldExports,
  removeExportFiles,
} from "./old-exports.ts";

const RETENTION_DAYS = 7;
const BATCH_SIZE = 1000;
const SOFT_LIMIT_MS = 60_000;
const DAY_MS = 86_400_000;

Deno.serve(async (req) => {
  if (!(await isCronCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const startedAt = Date.now();
  const db = createAdminClient();
  const cutoff = new Date(startedAt - RETENTION_DAYS * DAY_MS).toISOString();
  const removed = { exports: 0, files: 0 };

  while (Date.now() - startedAt < SOFT_LIMIT_MS) {
    const batch = await findOldExports(db, cutoff, BATCH_SIZE);
    removed.files += await removeExportFiles(db, batch);
    removed.exports += await deleteExportRows(db, batch);
    if (batch.length < BATCH_SIZE) break;
  }

  console.log(`Removed ${removed.exports} exports and ${removed.files} files`);
  return Response.json(removed);
});
