import "server-only";
import { connection } from "next/server";
import type { ExportStatus } from "@shared/export-status";
import { createClient } from "@/lib/supabase/server";
import { getTokens } from "./tokens";

const LINK_LIFETIME_SECONDS = 600;
const OWN_EXPORTS_LIMIT = 10;
const exportIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type { ExportStatus };

export type OwnExport = {
  id: string;
  tokenSymbol: string | null;
  periodStart: string;
  periodEnd: string;
  status: ExportStatus;
  createdAt: string;
};

export async function getOwnExports(): Promise<OwnExport[]> {
  await connection();
  const supabase = await createClient();
  const [{ data, error }, tokens] = await Promise.all([
    supabase
      .from("exports")
      .select("id, token, period_start, period_end, status, created_at")
      .order("created_at", { ascending: false })
      .limit(OWN_EXPORTS_LIMIT),
    getTokens(),
  ]);
  if (error) throw new Error(`exports select failed: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    tokenSymbol: tokens.find(({ address }) => address === row.token)?.symbol ?? null,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status as ExportStatus,
    createdAt: row.created_at,
  }));
}

export async function requestExport(request: {
  periodStart: string;
  periodEnd: string;
  token?: string;
}): Promise<string | null> {
  await connection();
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_export", {
    p_period_start: request.periodStart,
    p_period_end: request.periodEnd,
    p_token: request.token,
  });
  if (!error) return null;
  if (error.code === "P0001") return error.message;
  throw new Error(`request_export failed: ${error.message}`);
}

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
