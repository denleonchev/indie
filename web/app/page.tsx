import { Suspense } from "react";
import FeedSkeleton from "./feed-skeleton";
import IndexerStatus from "./indexer-status";
import TransferFeed from "./transfer-feed";
import WalletHint from "./wallet-hint";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Transfers</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <IndexerStatus />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<FeedSkeleton />}>
          <TransferFeed searchParams={searchParams} />
        </Suspense>
      </div>
      <WalletHint />
    </main>
  );
}
