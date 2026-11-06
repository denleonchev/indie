import { getSignedInWallet } from "@/data/auth";
import { getOwnExports, type OwnExport } from "@/data/exports";
import { getRequestTime } from "@/data/request-time";
import { getTokens, type Token } from "@/data/tokens";
import ExportForm from "./export-form";
import ExportList from "./export-list";
import RefreshOnSignal from "./refresh-on-signal";

const DEFAULT_PERIOD_DAYS = 14;
const DAY_MS = 86_400_000;

export default async function ExportsSection() {
  const now = await getRequestTime();
  const wallet = await getSignedInWallet();
  if (!wallet) return null;

  let exports: OwnExport[];
  let tokens: Token[];
  try {
    [exports, tokens] = await Promise.all([getOwnExports(), getTokens()]);
  } catch (error) {
    console.error(error);
    return <p>Could not load your exports</p>;
  }

  const today = new Date(now).toISOString().slice(0, 10);
  const firstDay = new Date(now - (DEFAULT_PERIOD_DAYS - 1) * DAY_MS).toISOString().slice(0, 10);

  return (
    <section className="mb-8 flex flex-col gap-3">
      <RefreshOnSignal channel={`exports:${wallet}`} />
      <h2 className="text-lg font-semibold">Exports</h2>
      <ExportForm tokens={tokens} defaultFrom={firstDay} defaultTo={today} />
      <ExportList exports={exports} now={now} />
    </section>
  );
}
