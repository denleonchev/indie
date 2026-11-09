import type { Transfer } from "@/data/transfers";
import { formatAmount, shortAddress } from "@/lib/format";
import TimeAgo from "./time-ago";

const placeOnSmallScreens = {
  time: "col-start-1 row-start-2",
  addresses: "col-start-1 row-start-1",
  amount: "col-start-2 row-start-1",
  link: "col-start-2 row-start-2",
};
const placeInColumns = "sm:col-start-auto sm:row-start-auto";

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
    <div className="text-sm sm:grid sm:grid-cols-[auto_auto_auto_1fr_auto] sm:gap-x-6">
      <div className="hidden border-b border-line pb-2 text-xs text-muted sm:col-span-5 sm:grid sm:grid-cols-subgrid">
        <span>Time</span>
        <span>From</span>
        <span>To</span>
        <span className="text-right">Amount</span>
      </div>
      <ul className="divide-y divide-line sm:col-span-5 sm:grid sm:grid-cols-subgrid">
        {transfers.map((transfer) => {
          const sign = wallet === undefined ? "" : transfer.to_address === wallet ? "+" : "−";
          return (
            <li
              key={`${transfer.tx_hash}:${transfer.log_index}`}
              className="grid grid-cols-[1fr_auto] gap-x-4 py-2 sm:col-span-5 sm:grid-cols-subgrid"
            >
              <TimeAgo
                iso={transfer.block_time}
                serverNow={now}
                className={`${placeOnSmallScreens.time} ${placeInColumns} text-muted`}
              />
              <span className={`${placeOnSmallScreens.addresses} flex gap-1 font-mono sm:contents`}>
                <span title={transfer.from_address}>{shortAddress(transfer.from_address)}</span>
                <span className="sm:hidden">→</span>
                <span title={transfer.to_address}>{shortAddress(transfer.to_address)}</span>
              </span>
              <span className={`${placeOnSmallScreens.amount} ${placeInColumns} text-right font-mono`}>
                {sign}
                {formatAmount(transfer.amount, transfer.tokens.decimals)}{" "}
                <span className="text-muted">{transfer.tokens.symbol}</span>
              </span>
              {explorerUrl && (
                <a
                  href={`${explorerUrl}/tx/${transfer.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in the block explorer"
                  className={`${placeOnSmallScreens.link} ${placeInColumns} justify-self-end`}
                >
                  ↗
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
