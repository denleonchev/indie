import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

const walletPattern = /^0x[0-9a-f]{40}$/;

export const getSignedInWallet = cache(async (): Promise<string | null> => {
  await connection();
  const supabase = await createClient();
  try {
    const { data } = await supabase.auth.getClaims();
    const wallet = data?.claims.wallet;
    return typeof wallet === "string" && walletPattern.test(wallet) ? wallet : null;
  } catch {
    return null;
  }
});
