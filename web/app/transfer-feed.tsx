import { createClient } from "@/lib/supabase/public";
import TransferList, { transferColumns } from "./transfer-list";

export default async function TransferFeed() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transfers")
    .select(transferColumns)
    .order("block_time", { ascending: false })
    .order("log_index", { ascending: false })
    .limit(50);
  if (error) {
    console.error(error);
    return <p>Could not load the transfers</p>;
  }
  if (data.length === 0) return <p>No transfers yet</p>;
  return <TransferList transfers={data} />;
}
