import type { createAdminClient } from "../_shared/db.ts";

type Db = ReturnType<typeof createAdminClient>;
type OldExport = { id: string; file_path: string | null };

export async function findOldExports(
  db: Db,
  cutoff: string,
  limit: number,
): Promise<OldExport[]> {
  const { data, error } = await db
    .from("exports")
    .select("id, file_path")
    .lt("created_at", cutoff)
    .limit(limit);
  if (error) throw new Error(`exports select failed: ${error.message}`);
  return data;
}

export async function removeExportFiles(db: Db, exports: OldExport[]) {
  const filePaths = exports.flatMap(({ file_path }) =>
    file_path ? [file_path] : []
  );
  if (filePaths.length === 0) return 0;

  const { error } = await db.storage.from("exports").remove(filePaths);
  if (error) throw new Error(`file removal failed: ${error.message}`);
  return filePaths.length;
}

export async function deleteExportRows(db: Db, exports: OldExport[]) {
  if (exports.length === 0) return 0;

  const { error } = await db
    .from("exports")
    .delete()
    .in("id", exports.map(({ id }) => id));
  if (error) throw new Error(`exports delete failed: ${error.message}`);
  return exports.length;
}
