import { connection } from "next/server";
import { getSignedInWallet } from "@/data/auth";
import { shortAddress } from "@/lib/format";
import SignInButton from "./sign-in-button";
import SignOutButton from "./sign-out-button";

export default async function Account() {
  await connection();
  const wallet = await getSignedInWallet();

  if (!wallet) return <SignInButton />;

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
