import Link from "next/link";
import { getSignedInWallet } from "@/data/auth";
import { getTokens, type Token } from "@/data/tokens";
import { getTransfers, type Feed } from "@/data/transfers";
import TransferList from "./transfer-list";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Filters = { ownWallet: boolean; token?: string };

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function filterHref({ ownWallet, token }: Filters) {
  const params = new URLSearchParams();
  if (ownWallet) params.set("wallet", "me");
  if (token) params.set("token", token);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded border px-2 py-0.5 ${active ? "border-gray-900 font-semibold" : "border-gray-300 text-gray-600"}`}
    >
      {children}
    </Link>
  );
}

export default async function TransferFeed({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  let signedInWallet: string | null;
  let tokens: Token[];
  let feed: Feed;
  try {
    [signedInWallet, tokens, feed] = await Promise.all([
      getSignedInWallet(),
      getTokens(),
      getTransfers({ ownWallet: single(params.wallet) === "me", token: single(params.token) }),
    ]);
  } catch (error) {
    console.error(error);
    return <p>Could not load the transfers</p>;
  }

  const { transfers, isOwnWalletFilterApplied, token } = feed;

  const emptyText = [
    "No",
    token?.symbol,
    "transfers",
    isOwnWalletFilterApplied ? "of your address" : undefined,
    "in the last 14 days",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-4">
      {(signedInWallet || tokens.length > 1) && (
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {signedInWallet && (
            <div className="flex gap-2">
              <FilterLink href={filterHref({ ownWallet: false, token: token?.address })} active={!isOwnWalletFilterApplied}>
                All
              </FilterLink>
              <FilterLink href={filterHref({ ownWallet: true, token: token?.address })} active={isOwnWalletFilterApplied}>
                Mine
              </FilterLink>
            </div>
          )}
          {tokens.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <FilterLink href={filterHref({ ownWallet: isOwnWalletFilterApplied })} active={!token}>
                All tokens
              </FilterLink>
              {tokens.map(({ address, symbol }) => (
                <FilterLink key={address} href={filterHref({ ownWallet: isOwnWalletFilterApplied, token: address })} active={token?.address === address}>
                  {symbol}
                </FilterLink>
              ))}
            </div>
          )}
        </nav>
      )}
      {transfers.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <TransferList transfers={transfers} wallet={isOwnWalletFilterApplied ? (signedInWallet ?? undefined) : undefined} />
      )}
    </div>
  );
}
