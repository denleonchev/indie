"use client";

import { useHasWallet } from "@/lib/use-has-wallet";

export default function WalletHint() {
  if (useHasWallet() !== false) return null;
  return (
    <p className="mt-6 text-sm text-gray-500">
      To see your own transfers, sign in with a browser wallet such as MetaMask.
    </p>
  );
}
