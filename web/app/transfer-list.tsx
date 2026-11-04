import type { Transfer } from "@/data/transfers";
import { formatAmount, shortAddress } from "@/lib/format";
import TimeAgo from "./time-ago";

export default function TransferList({
  transfers,
  wallet,
  now,
}: {
  transfers: Transfer[];
  wallet?: string;
  now: number;
}) {
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
            <TimeAgo iso={transfer.block_time} serverNow={now} className="w-28 text-gray-500" />
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
