import type { TransferFilters } from "@/data/transfers";

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function readFeedFilters(params: SearchParams): TransferFilters {
  return { ownWallet: single(params.wallet) === "me", token: single(params.token) };
}

export function feedHref({ ownWallet, token }: TransferFilters) {
  const params = new URLSearchParams();
  if (ownWallet) params.set("wallet", "me");
  if (token) params.set("token", token);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
