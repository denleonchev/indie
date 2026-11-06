import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LINK_LIFETIME_SECONDS = 600;
const exportIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function getExportDownloadUrl(exportId: string): Promise<string | null> {
  await connection();
  if (!exportIdPattern.test(exportId)) return null;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("exports")
    .select("status, file_path")
    .eq("id", exportId)
    .maybeSingle();
  if (error) throw new Error(`exports select failed: ${error.message}`);
  if (row?.status !== "ready" || !row.file_path) return null;

  const { data, error: signError } = await supabase.storage
    .from("exports")
    .createSignedUrl(row.file_path, LINK_LIFETIME_SECONDS);
  if (signError) throw new Error(`createSignedUrl failed: ${signError.message}`);
  return data.signedUrl;
}
