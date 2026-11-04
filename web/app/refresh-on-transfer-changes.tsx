"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const REFRESH_DELAY_MS = 1000;

export default function RefreshOnTransferChanges() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let subscribedBefore = false;

    function refreshSoon() {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        router.refresh();
      }, REFRESH_DELAY_MS);
    }

    const channel = supabase
      .channel("transfers", { config: { private: true } })
      .on("broadcast", { event: "changed" }, refreshSoon)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (subscribedBefore) refreshSoon();
        subscribedBefore = true;
      });

    return () => {
      clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
