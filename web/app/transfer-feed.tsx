import { getSignedInWallet } from "@/data/auth";
import { getOwnExports, type OwnExport } from "@/data/exports";
import { getRequestTime } from "@/data/request-time";
import { getRetentionDays } from "@/data/settings";
import { getTokens, type Token } from "@/data/tokens";
import { FEED_PAGE_SIZE, getTransfers, type Feed } from "@/data/transfers";
import { readFeedFilters } from "@/lib/feed-url";
import ExportDialog from "./export-dialog";
import ExportForm from "./export-form";
import ExportList from "./export-list";
import FeedFilters from "./feed-filters";
import NewTransfersBanner from "./new-transfers-banner";
import RefreshOnSignal from "./refresh-on-signal";
import TransferList from "./transfer-list";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DEFAULT_EXPORT_DAYS = 14;
const DAY_MS = 86_400_000;

async function getOwnExportsIfSignedIn(): Promise<OwnExport[] | null> {
  if (!(await getSignedInWallet())) return null;
  try {
    return await getOwnExports();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function toDay(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

export default async function TransferFeed({ searchParams }: { searchParams: SearchParams }) {
  const now = await getRequestTime();
  const filters = readFeedFilters(await searchParams);
  let signedInWallet: string | null;
  let tokens: Token[];
  let feed: Feed;
  let exports: OwnExport[] | null;
  let retentionDays: number;
  try {
    [signedInWallet, tokens, feed, exports, retentionDays] = await Promise.all([
      getSignedInWallet(),
      getTokens(),
      getTransfers(filters),
      getOwnExportsIfSignedIn(),
      getRetentionDays(),
    ]);
  } catch (error) {
    console.error(error);
    return <p>Could not load the transfers</p>;
  }

  const { transfers, isOwnWalletFilterApplied, token } = feed;

  const emptyText = [
    "No",
    token?.symbol,
    "transfers",
    isOwnWalletFilterApplied ? "of your address" : undefined,
    `in the last ${retentionDays} ${retentionDays === 1 ? "day" : "days"}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm">
        <FeedFilters
          signedIn={signedInWallet !== null}
          tokens={tokens}
          isOwnWalletFilterApplied={isOwnWalletFilterApplied}
          token={token}
        />
        {signedInWallet && (
          <ExportDialog hasPendingExport={exports?.some(({ status }) => status === "pending") ?? false}>
            <RefreshOnSignal channel={`exports:${signedInWallet}`} />
            <ExportForm
              key={token?.address ?? ""}
              tokens={tokens}
              defaultFrom={toDay(now - (DEFAULT_EXPORT_DAYS - 1) * DAY_MS)}
              defaultTo={toDay(now)}
              defaultToken={token?.address}
            />
            {exports ? (
              <ExportList exports={exports} now={now} />
            ) : (
              <p className="text-sm text-danger">Could not load your exports</p>
            )}
          </ExportDialog>
        )}
      </div>
      <NewTransfersBanner showCount={!isOwnWalletFilterApplied && !token} />
      {transfers.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <TransferList
          transfers={transfers}
          wallet={isOwnWalletFilterApplied ? (signedInWallet ?? undefined) : undefined}
          now={now}
        />
      )}
      {transfers.length === FEED_PAGE_SIZE && (
        <p className="text-sm text-muted">Latest {FEED_PAGE_SIZE} transfers</p>
      )}
    </div>
  );
}
