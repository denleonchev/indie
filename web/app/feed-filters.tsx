import Link from "next/link";
import type { Token } from "@/data/tokens";
import { feedHref } from "@/lib/feed-url";

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

export default function FeedFilters({
  signedIn,
  tokens,
  isOwnWalletFilterApplied,
  token,
}: {
  signedIn: boolean;
  tokens: Token[];
  isOwnWalletFilterApplied: boolean;
  token?: Token;
}) {
  const showTokenFilter = tokens.length > 1;
  if (!signedIn && !showTokenFilter) return null;

  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2">
      {signedIn && (
        <div className="flex gap-2">
          <FilterLink href={feedHref({ ownWallet: false, token: token?.address })} active={!isOwnWalletFilterApplied}>
            All
          </FilterLink>
          <FilterLink href={feedHref({ ownWallet: true, token: token?.address })} active={isOwnWalletFilterApplied}>
            Mine
          </FilterLink>
        </div>
      )}
      {showTokenFilter && (
        <div className="flex flex-wrap gap-2">
          <FilterLink href={feedHref({ ownWallet: isOwnWalletFilterApplied })} active={!token}>
            All tokens
          </FilterLink>
          {tokens.map(({ address, symbol }) => (
            <FilterLink
              key={address}
              href={feedHref({ ownWallet: isOwnWalletFilterApplied, token: address })}
              active={token?.address === address}
            >
              {symbol}
            </FilterLink>
          ))}
        </div>
      )}
    </nav>
  );
}
