import { Suspense } from "react";
import IndexerStatus from "./indexer-status";
import TransferFeed from "./transfer-feed";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Latest transfers</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <IndexerStatus />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<p>Loading…</p>}>
          <TransferFeed />
        </Suspense>
      </div>
    </main>
  );
}
