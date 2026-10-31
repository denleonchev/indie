import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";

export default async function IndexerStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("indexer_state")
    .select("last_block, last_block_at")
    .maybeSingle();
  if (error) {
    console.error(error);
    return <p>Could not load the indexer status</p>;
  }
  if (!data) return <p>The indexer has not started yet</p>;

  return (
    <p className="text-sm text-gray-500">
      Indexed up to block {data.last_block.toLocaleString("en")}, created{" "}
      <time dateTime={data.last_block_at} title={data.last_block_at}>
        {timeAgo(data.last_block_at)}
      </time>
    </p>
  );
}
