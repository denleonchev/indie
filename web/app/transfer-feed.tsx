import Link from "next/link";
import { redirect } from "next/navigation";
import { getSignedInWallet } from "@/data/auth";
import { getOwnExports, type OwnExport } from "@/data/exports";
import { getRequestTime } from "@/data/request-time";
import { getRetentionDays } from "@/data/settings";
import { getTokens, type Token } from "@/data/tokens";
import { FEED_PAGE_SIZE, getTransfers, type Feed } from "@/data/transfers";
import { cursorAt, feedHref, readFeedCursor, readFeedFilters } from "@/lib/feed-url";
import ExportDialog from "./export-dialog";
import ExportForm from "./export-form";
import ExportList from "./export-list";
import FeedFilters from "./feed-filters";
import { FeedNavigationProvider, FeedPending } from "./feed-navigation";
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
  const params = await searchParams;
  const filters = readFeedFilters(params);
  const cursor = readFeedCursor(params);
  let signedInWallet: string | null;
  let tokens: Token[];
  let feed: Feed;
  let exports: OwnExport[] | null;
  let retentionDays: number;
  try {
    [signedInWallet, tokens, feed, exports, retentionDays] = await Promise.all([
      getSignedInWallet(),
      getTokens(),
      getTransfers(filters, cursor),
      getOwnExportsIfSignedIn(),
      getRetentionDays(),
    ]);
  } catch (error) {
    console.error(error);
    return <p>Could not load the transfers</p>;
  }

  const { transfers, hasOlder, hasNewer, isOwnWalletFilterApplied, token } = feed;
  const pageFilters = {
    ownWallet: isOwnWalletFilterApplied,
    token: token?.address,
  };
  if (cursor?.direction === "after" && !hasNewer) redirect(feedHref(pageFilters));

  const emptyText = cursor
    ? "No older transfers"
    : [
        "No",
        token?.symbol,
        "transfers",
        isOwnWalletFilterApplied ? "of your address" : undefined,
        `in the last ${retentionDays} ${retentionDays === 1 ? "day" : "days"}`,
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <FeedNavigationProvider>
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
        {!cursor && <NewTransfersBanner showCount={!isOwnWalletFilterApplied && !token} />}
        <FeedPending>
          {transfers.length === 0 ? (
            <p className="text-sm text-muted">{emptyText}</p>
          ) : (
            <TransferList
              transfers={transfers}
              wallet={isOwnWalletFilterApplied ? (signedInWallet ?? undefined) : undefined}
              now={now}
            />
          )}
          <nav aria-label="Feed pages" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {!cursor && transfers.length === FEED_PAGE_SIZE && (
              <span className="text-muted">Latest {FEED_PAGE_SIZE} transfers</span>
            )}
            {cursor && <Link href={feedHref(pageFilters)}>« Newest</Link>}
            {hasNewer && transfers.length > 0 && (
              <Link href={feedHref(pageFilters, cursorAt(transfers[0], "after"))}>‹ Newer</Link>
            )}
            {hasOlder && (
              <Link
                href={feedHref(pageFilters, cursorAt(transfers[transfers.length - 1], "before"))}
                className="ml-auto"
              >
                Older ›
              </Link>
            )}
          </nav>
        </FeedPending>
      </div>
    </FeedNavigationProvider>
  );
}
