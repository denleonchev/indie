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
    <p className="flex items-center gap-3 whitespace-nowrap text-sm">
      <span>
        <span className="hidden sm:inline">Signed in as </span>
        <span className="font-mono" title={wallet}>
          {shortAddress(wallet)}
        </span>
      </span>
      <SignOutButton />
    </p>
  );
}
