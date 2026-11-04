import { Suspense } from "react";
import Account from "./account";
import IndexerStatus from "./indexer-status";
import RefreshOnTransferChanges from "./refresh-on-transfer-changes";
import TransferFeed from "./transfer-feed";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <RefreshOnTransferChanges />
      <div className="mb-4">
        <Suspense fallback={null}>
          <Account />
        </Suspense>
      </div>
      <h1 className="text-xl font-semibold">Transfers</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <IndexerStatus />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<p>Loading…</p>}>
          <TransferFeed searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
