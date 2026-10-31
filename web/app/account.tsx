import { connection } from "next/server";
import { shortAddress } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "./sign-in-button";
import MyTransfers from "./my-transfers";
import SignOutButton from "./sign-out-button";

export default async function Account() {
  await connection();
  const supabase = await createClient();
  const wallet = await supabase.auth
    .getClaims()
    .then(({ data }) => data?.claims.wallet)
    .catch(() => null);

  if (typeof wallet !== "string") return <SignInButton />;

  return (
    <section className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          Signed in as{" "}
          <span className="font-mono" title={wallet}>
            {shortAddress(wallet)}
          </span>
        </span>
        <SignOutButton />
      </p>
      <h2 className="text-lg font-semibold">My transfers</h2>
      <MyTransfers wallet={wallet} />
    </section>
  );
}
