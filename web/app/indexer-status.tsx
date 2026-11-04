import { getIndexerStatus, type IndexerStatus as Status } from "@/data/indexer";
import { timeAgo } from "@/lib/format";

export default async function IndexerStatus() {
  let status: Status | null;
  try {
    status = await getIndexerStatus();
  } catch (error) {
    console.error(error);
    return <p>Could not load the indexer status</p>;
  }
  if (!status) return <p>The indexer has not started yet</p>;

  return (
    <p className="text-sm text-gray-500">
      Indexed up to block {status.lastBlock.toLocaleString("en")}, created{" "}
      <time dateTime={status.lastBlockAt} title={status.lastBlockAt}>
        {timeAgo(status.lastBlockAt)}
      </time>
    </p>
  );
}
