import type { createAdminClient } from "../_shared/db.ts";
import type { ExportStatus } from "../_shared/export-status.ts";

type Db = ReturnType<typeof createAdminClient>;
export type Job = { msg_id: number; read_ct: number; message: unknown };

const MAX_ATTEMPTS = 3;

async function deleteJob(db: Db, messageId: number) {
  const { error } = await db.rpc("delete_export_job", {
    p_message_id: messageId,
  });
  if (error) throw new Error(`delete_export_job failed: ${error.message}`);
}

async function markFailed(db: Db, exportId: string) {
  const { error } = await db
    .from("exports")
    .update({
      status: "failed" satisfies ExportStatus,
      finished_at: new Date().toISOString(),
    })
    .eq("id", exportId)
    .eq("status", "pending" satisfies ExportStatus);
  if (error) throw new Error(`exports update failed: ${error.message}`);
}

async function buildExport(db: Db, exportId: string, wallet: string) {
  const { data: csv, error } = await db.rpc("build_export_csv", {
    p_export_id: exportId,
  });
  if (error) throw new Error(`build_export_csv failed: ${error.message}`);

  const filePath = `${wallet}/${exportId}.csv`;
  const upload = await db.storage
    .from("exports")
    .upload(filePath, csv, { contentType: "text/csv", upsert: true });
  if (upload.error) throw new Error(`upload failed: ${upload.error.message}`);

  const { error: updateError } = await db
    .from("exports")
    .update({
      status: "ready" satisfies ExportStatus,
      file_path: filePath,
      finished_at: new Date().toISOString(),
    })
    .eq("id", exportId)
    .eq("status", "pending" satisfies ExportStatus);
  if (updateError) {
    throw new Error(`exports update failed: ${updateError.message}`);
  }
}

export async function handleJob(db: Db, job: Job) {
  const exportId = (job.message as { export_id?: string }).export_id;
  const { data: row, error } = await db
    .from("exports")
    .select("id, wallet, status")
    .eq("id", exportId ?? "")
    .maybeSingle();
  if (error) throw new Error(`exports select failed: ${error.message}`);

  if (!row || row.status !== ("pending" satisfies ExportStatus)) {
    await deleteJob(db, job.msg_id);
    return "skipped";
  }
  if (job.read_ct > MAX_ATTEMPTS) {
    await markFailed(db, row.id);
    await deleteJob(db, job.msg_id);
    return "failed";
  }

  try {
    await buildExport(db, row.id, row.wallet);
    await deleteJob(db, job.msg_id);
    return "ready";
  } catch (error) {
    console.error(`Export ${row.id}, attempt ${job.read_ct}:`, error);
    if (job.read_ct < MAX_ATTEMPTS) return "retry";
    await markFailed(db, row.id);
    await deleteJob(db, job.msg_id);
    return "failed";
  }
}
