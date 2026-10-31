import { connection } from "next/server";
import { shortAddress } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "./sign-in-button";
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
    <p className="flex flex-wrap items-center gap-3 text-sm">
      <span>
        Signed in as{" "}
        <span className="font-mono" title={wallet}>
          {shortAddress(wallet)}
        </span>
      </span>
      <SignOutButton />
    </p>
  );
}
