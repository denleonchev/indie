"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className="underline">
      Sign out
    </button>
  );
}
