"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Signal = { operation?: string; transfer_count?: number };

export default function NewTransfersBanner({ showCount }: { showCount: boolean }) {
  const router = useRouter();
  const [newTransferCount, setNewTransferCount] = useState(0);
  const [hasOtherChanges, setHasOtherChanges] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let subscribedBefore = false;

    const channel = supabase
      .channel("transfers", { config: { private: true } })
      .on("broadcast", { event: "changed" }, ({ payload }: { payload: Signal }) => {
        if (payload.operation === "INSERT" && payload.transfer_count) {
          setNewTransferCount((count) => count + (payload.transfer_count ?? 0));
        } else {
          setHasOtherChanges(true);
        }
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (subscribedBefore) setHasOtherChanges(true);
        subscribedBefore = true;
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function showNewTransfers() {
    setNewTransferCount(0);
    setHasOtherChanges(false);
    router.refresh();
  }

  const label =
    showCount && newTransferCount > 0
      ? `↑ ${newTransferCount} new transfer${newTransferCount === 1 ? "" : "s"}`
      : "↑ Show new transfers";

  return (
    <div className="sticky top-4 z-10 -mt-4 flex h-0 justify-center">
      {(newTransferCount > 0 || hasOtherChanges) && (
        <button
          type="button"
          onClick={showNewTransfers}
          className="h-fit rounded-full border border-control bg-surface px-3 py-1 text-sm shadow"
        >
          {label}
        </button>
      )}
    </div>
  );
}
