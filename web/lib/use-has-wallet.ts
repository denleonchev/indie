"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function hasWallet() {
  return "ethereum" in window;
}

export function useHasWallet(): boolean | null {
  return useSyncExternalStore(subscribe, hasWallet, () => null);
}
