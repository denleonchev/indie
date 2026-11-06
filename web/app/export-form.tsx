"use client";

import { useActionState } from "react";
import type { Token } from "@/data/tokens";
import { requestExportAction } from "./export-actions";

export default function ExportForm({
  tokens,
  defaultFrom,
  defaultTo,
}: {
  tokens: Token[];
  defaultFrom: string;
  defaultTo: string;
}) {
  const [state, formAction, pending] = useActionState(requestExportAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        From
        <input type="date" name="from" defaultValue={defaultFrom} required className="rounded border px-2 py-1" />
      </label>
      <label className="flex flex-col gap-1">
        To
        <input type="date" name="to" defaultValue={defaultTo} required className="rounded border px-2 py-1" />
      </label>
      {tokens.length > 1 && (
        <label className="flex flex-col gap-1">
          Token
          <select name="token" defaultValue="" className="rounded border px-2 py-1">
            <option value="">All tokens</option>
            {tokens.map(({ address, symbol }) => (
              <option key={address} value={address}>
                {symbol}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
      >
        {pending ? "Requesting…" : "Export CSV"}
      </button>
      {state.error && <p className="w-full text-red-600">{state.error}</p>}
    </form>
  );
}
