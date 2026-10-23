import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export default async function HeadBlock() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase
    .from("indexer_state")
    .select("head_block, updated_at")
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
      {data.head_block} at {data.updated_at}
    </span>
  );
}
