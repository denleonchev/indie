"use client";

import { useSyncExternalStore } from "react";
import { timeAgo } from "@/lib/format";

const TICK_MS = 15_000;

let now: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const notify of listeners) notify();
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getNow() {
  return now;
}

export default function TimeAgo({ iso, serverNow, className }: { iso: string; serverNow: number; className?: string }) {
  const clientNow = useSyncExternalStore(subscribe, getNow, () => serverNow);
  return (
    <time dateTime={iso} title={iso} className={className}>
      {timeAgo(iso, clientNow ?? serverNow)}
    </time>
  );
}
