import { getSignedInWallet } from "@/data/auth";
import { getRequestTime } from "@/data/request-time";
import { getTokens, type Token } from "@/data/tokens";
import { getTransfers, type Feed } from "@/data/transfers";
import { readFeedFilters } from "@/lib/feed-url";
import FeedFilters from "./feed-filters";
import NewTransfersBanner from "./new-transfers-banner";
import TransferList from "./transfer-list";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TransferFeed({ searchParams }: { searchParams: SearchParams }) {
  const now = await getRequestTime();
  const filters = readFeedFilters(await searchParams);
  let signedInWallet: string | null;
  let tokens: Token[];
  let feed: Feed;
  try {
    [signedInWallet, tokens, feed] = await Promise.all([getSignedInWallet(), getTokens(), getTransfers(filters)]);
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
    "in the last 14 days",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-4">
      <FeedFilters
        signedIn={signedInWallet !== null}
        tokens={tokens}
        isOwnWalletFilterApplied={isOwnWalletFilterApplied}
        token={token}
      />
      <NewTransfersBanner showCount={!isOwnWalletFilterApplied && !token} />
      {transfers.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <TransferList
          transfers={transfers}
          wallet={isOwnWalletFilterApplied ? (signedInWallet ?? undefined) : undefined}
          now={now}
        />
      )}
    </div>
  );
}
