import { Suspense } from "react";
import HeadBlock from "./head-block";

export default function Home() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <HeadBlock />
    </Suspense>
  );
}
