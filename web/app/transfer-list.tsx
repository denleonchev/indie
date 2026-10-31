import { formatAmount, shortAddress, timeAgo } from "@/lib/format";

export const transferColumns =
  "tx_hash, log_index, from_address, to_address, amount::text, block_time, tokens(symbol, decimals)";

type Transfer = {
  tx_hash: string;
  log_index: number;
  from_address: string;
  to_address: string;
  amount: string;
  block_time: string;
  tokens: { symbol: string; decimals: number };
};

export default function TransferList({ transfers, wallet }: { transfers: Transfer[]; wallet?: string }) {
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL;
  return (
    <ul className="divide-y divide-gray-200">
      {transfers.map((transfer) => {
        const sign = wallet === undefined ? "" : transfer.to_address === wallet ? "+" : "−";
        return (
          <li
            key={`${transfer.tx_hash}:${transfer.log_index}`}
            className="flex flex-wrap gap-x-4 py-2 font-mono text-sm"
          >
            <time dateTime={transfer.block_time} title={transfer.block_time} className="w-28 text-gray-500">
              {timeAgo(transfer.block_time)}
            </time>
            <span className="w-40 text-right">
              {sign}
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
        );
      })}
    </ul>
  );
}
