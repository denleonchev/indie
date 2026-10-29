import type { Store } from "./store.ts";

export async function takeLease(store: Store, passSoftLimitMs: number) {
  const now = new Date();
  const leaseDurationMs = passSoftLimitMs * 3;
  const leaseUntil = new Date(now.getTime() + leaseDurationMs).toISOString();
  return (await store.takeLease(leaseUntil, now.toISOString()))
    ? leaseUntil
    : null;
}
