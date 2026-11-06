"use server";

import { revalidatePath } from "next/cache";
import { requestExport } from "@/data/exports";

export type ExportFormState = { error?: string };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export async function requestExportAction(
  _state: ExportFormState,
  formData: FormData,
): Promise<ExportFormState> {
  const from = formData.get("from");
  const to = formData.get("to");
  const token = formData.get("token");
  if (typeof from !== "string" || typeof to !== "string" || !datePattern.test(from) || !datePattern.test(to)) {
    return { error: "Pick both dates" };
  }

  const periodStart = `${from}T00:00:00Z`;
  const periodEnd = new Date(Date.parse(`${to}T00:00:00Z`) + DAY_MS).toISOString();
  const error = await requestExport({
    periodStart,
    periodEnd,
    token: typeof token === "string" && token !== "" ? token : undefined,
  });
  if (error) return { error };

  revalidatePath("/");
  return {};
}
