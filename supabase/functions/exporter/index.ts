import "@supabase/functions-js/edge-runtime.d.ts";
import { isCronCall } from "../_shared/cron-auth.ts";
import { createAdminClient } from "../_shared/db.ts";
import { handleJob, type Job } from "./exports.ts";

const JOBS_PER_CALL = 3;

Deno.serve(async (req) => {
  if (!(await isCronCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("read_export_jobs", {
    p_count: JOBS_PER_CALL,
  });
  if (error) throw new Error(`read_export_jobs failed: ${error.message}`);
  const jobs = data as Job[];

  const settled = await Promise.allSettled(
    jobs.map((job) => handleJob(db, job)),
  );
  const results = settled.map((outcome, index) => {
    const messageId = jobs[index].msg_id;
    if (outcome.status === "fulfilled") {
      return { messageId, result: outcome.value };
    }
    console.error(`Export job ${messageId}:`, outcome.reason);
    return { messageId, result: "error" };
  });
  if (results.length > 0) console.log("Export jobs:", JSON.stringify(results));
  return Response.json({ results });
});
