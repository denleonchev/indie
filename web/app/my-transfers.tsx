import { createClient } from "@/lib/supabase/public";
import TransferList, { transferColumns } from "./transfer-list";

export default async function MyTransfers({ wallet }: { wallet: string }) {
  if (!/^0x[0-9a-f]{40}$/.test(wallet)) return <p>Could not read your wallet address</p>;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("transfers")
    .select(transferColumns)
    .or(`from_address.eq.${wallet},to_address.eq.${wallet}`)
    .order("block_time", { ascending: false })
    .order("log_index", { ascending: false })
    .limit(50);
  if (error) {
    console.error(error);
    return <p>Could not load your transfers</p>;
  }
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No transfers of your address in the last 14 days</p>;
  }
  return <TransferList transfers={data} wallet={wallet} />;
}
