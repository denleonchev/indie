"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

function subscribe() {
  return () => {};
}

function hasWallet() {
  return "ethereum" in window;
}

function isRejection(error: unknown) {
  const code = (error as { code?: unknown })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code === 4001 || /reject|denied/i.test(message);
}

export default function SignInButton() {
  const router = useRouter();
  const walletFound = useSyncExternalStore(subscribe, hasWallet, () => null);
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

  if (walletFound === null) return null;

  if (!walletFound) {
    return (
      <p className="text-sm text-gray-500">
        To see your own transfers, sign in with a browser wallet such as MetaMask.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <button
        type="button"
        onClick={signIn}
        disabled={signing}
        className="self-start rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
      >
        {signing ? "Waiting for the wallet…" : "Sign in with wallet"}
      </button>
      {problem && <p className="text-red-600">{problem}</p>}
    </div>
  );
}
