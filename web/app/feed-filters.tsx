import type { Token } from "@/data/tokens";
import { feedHref } from "@/lib/feed-url";
import { FilterGroup } from "./feed-navigation";

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
        <FilterGroup
          options={[
            {
              href: feedHref({ ownWallet: false, token: token?.address }),
              label: "All",
              active: !isOwnWalletFilterApplied,
            },
            {
              href: feedHref({ ownWallet: true, token: token?.address }),
              label: "Mine",
              active: isOwnWalletFilterApplied,
            },
          ]}
        />
      )}
      {showTokenFilter && (
        <FilterGroup
          options={[
            { href: feedHref({ ownWallet: isOwnWalletFilterApplied }), label: "All tokens", active: !token },
            ...tokens.map(({ address, symbol }) => ({
              href: feedHref({ ownWallet: isOwnWalletFilterApplied, token: address }),
              label: symbol,
              active: token?.address === address,
            })),
          ]}
        />
      )}
    </nav>
  );
}
