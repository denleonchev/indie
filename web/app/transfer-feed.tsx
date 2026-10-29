import { createPublicClient } from "@/lib/supabase";
import { formatAmount, shortAddress, timeAgo } from "@/lib/format";

export default async function TransferFeed() {
  const { data, error } = await createPublicClient()
    .from("transfers")
    .select("tx_hash, log_index, from_address, to_address, amount::text, block_time, tokens(symbol, decimals)")
    .order("block_time", { ascending: false })
    .order("log_index", { ascending: false })
    .limit(50);
  if (error) {
    console.error(error);
    return <p>Could not load the transfers</p>;
  }
  if (data.length === 0) return <p>No transfers yet</p>;

  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL;
  return (
    <ul className="divide-y divide-gray-200">
      {data.map((transfer) => (
        <li
          key={`${transfer.tx_hash}:${transfer.log_index}`}
          className="flex flex-wrap gap-x-4 py-2 font-mono text-sm"
        >
          <time dateTime={transfer.block_time} title={transfer.block_time} className="w-28 text-gray-500">
            {timeAgo(transfer.block_time)}
          </time>
          <span className="w-36 text-right">
            {formatAmount(transfer.amount, transfer.tokens.decimals)} {transfer.tokens.symbol}
          </span>
          <span>
            <span title={transfer.from_address}>{shortAddress(transfer.from_address)}</span>
            {" → "}
            <span title={transfer.to_address}>{shortAddress(transfer.to_address)}</span>
          </span>
          {explorerUrl && (
            <a href={`${explorerUrl}/tx/${transfer.tx_hash}`} target="_blank" rel="noreferrer">
              ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
