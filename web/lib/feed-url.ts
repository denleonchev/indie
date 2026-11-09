import type { FeedCursor, Transfer, TransferFilters } from "@/data/transfers";

type SearchParams = Record<string, string | string[] | undefined>;

const cursorPattern = /^(\d{1,12})-(\d{1,6})$/;

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function readFeedFilters(params: SearchParams): TransferFilters {
  return {
    ownWallet: single(params.wallet) === "me",
    token: single(params.token),
  };
}

export function readFeedCursor(params: SearchParams): FeedCursor | undefined {
  for (const direction of ["before", "after"] as const) {
    const match = single(params[direction])?.match(cursorPattern);
    if (match) {
      return {
        direction,
        blockTime: new Date(Number(match[1]) * 1000).toISOString(),
        logIndex: Number(match[2]),
      };
    }
  }
  return undefined;
}

export function cursorAt(transfer: Transfer, direction: FeedCursor["direction"]): FeedCursor {
  return {
    direction,
    blockTime: transfer.block_time,
    logIndex: transfer.log_index,
  };
}

export function feedHref({ ownWallet, token }: TransferFilters, cursor?: FeedCursor) {
  const params = new URLSearchParams();
  if (ownWallet) params.set("wallet", "me");
  if (token) params.set("token", token);
  if (cursor) params.set(cursor.direction, `${Date.parse(cursor.blockTime) / 1000}-${cursor.logIndex}`);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
