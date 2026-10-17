import "@supabase/functions-js/edge-runtime.d.ts";
import { isCronCall } from "../_shared/cron-auth.ts";

Deno.serve(async (req) => {
  if (!(await isCronCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ ok: true });
});
