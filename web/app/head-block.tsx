import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export default async function HeadBlock() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase
    .from("indexer_state")
    .select("last_block, last_block_at")
    .maybeSingle();
  if (error) {
    console.error(error);
    return "Could not load the block";
  }
  if (!data) {
    return "No block saved yet";
  }
  return (
    <span>
      {data.last_block} at {data.last_block_at}
    </span>
  );
}
