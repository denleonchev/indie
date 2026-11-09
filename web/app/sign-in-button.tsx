"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHasWallet } from "@/lib/use-has-wallet";

function isRejection(error: unknown) {
  const code = (error as { code?: unknown })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code === 4001 || /reject|denied/i.test(message);
}

export default function SignInButton() {
  const router = useRouter();
  const walletFound = useHasWallet();
  const [signing, setSigning] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function signIn() {
    setSigning(true);
    setProblem(null);
    try {
      const { error } = await createClient().auth.signInWithWeb3({
        chain: "ethereum",
        statement: "Sign in to Indie",
      });
      if (error) throw error;
      router.refresh();
    } catch (error) {
      setProblem(
        isRejection(error)
          ? "You rejected the signature. Sign in again when you are ready."
          : `Could not sign in: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setSigning(false);
    }
  }

  if (!walletFound) return null;

  return (
    <div className="relative text-sm">
      <button
        type="button"
        onClick={signIn}
        disabled={signing}
        className="whitespace-nowrap rounded border border-control px-3 py-1 disabled:opacity-50"
      >
        {signing ? "Waiting for the wallet…" : "Sign in with wallet"}
      </button>
      {problem && (
        <p className="absolute right-0 top-full z-20 mt-2 w-72 rounded border border-line bg-surface p-2 text-danger shadow">
          {problem}
        </p>
      )}
    </div>
  );
}
