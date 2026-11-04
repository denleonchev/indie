import Link from "next/link";
import { getSignedInWallet } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";
import TransferList, { transferColumns } from "./transfer-list";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Filters = { mine: boolean; token?: string };

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function filterHref({ mine, token }: Filters) {
  const params = new URLSearchParams();
  if (mine) params.set("wallet", "me");
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
  const supabase = await createClient();
  const [wallet, tokensResult] = await Promise.all([
    getSignedInWallet(),
    supabase.from("tokens").select("address, symbol").order("symbol"),
  ]);
  if (tokensResult.error) {
    console.error(tokensResult.error);
    return <p>Could not load the transfers</p>;
  }

  const tokens = tokensResult.data;
  const mine = wallet !== null && single(params.wallet) === "me";
  const token = tokens.find(({ address }) => address === single(params.token));

  let query = supabase.from("transfers").select(transferColumns);
  if (mine) query = query.or(`from_address.eq.${wallet},to_address.eq.${wallet}`);
  if (token) query = query.eq("token", token.address);
  const { data, error } = await query
    .order("block_time", { ascending: false })
    .order("log_index", { ascending: false })
    .limit(50);
  if (error) {
    console.error(error);
    return <p>Could not load the transfers</p>;
  }

  const emptyText = [
    "No",
    token?.symbol,
    "transfers",
    mine ? "of your address" : undefined,
    "in the last 14 days",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-4">
      {(wallet || tokens.length > 1) && (
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {wallet && (
            <div className="flex gap-2">
              <FilterLink href={filterHref({ mine: false, token: token?.address })} active={!mine}>
                All
              </FilterLink>
              <FilterLink href={filterHref({ mine: true, token: token?.address })} active={mine}>
                Mine
              </FilterLink>
            </div>
          )}
          {tokens.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <FilterLink href={filterHref({ mine })} active={!token}>
                All tokens
              </FilterLink>
              {tokens.map(({ address, symbol }) => (
                <FilterLink key={address} href={filterHref({ mine, token: address })} active={token?.address === address}>
                  {symbol}
                </FilterLink>
              ))}
            </div>
          )}
        </nav>
      )}
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <TransferList transfers={data} wallet={mine ? wallet! : undefined} />
      )}
    </div>
  );
}
