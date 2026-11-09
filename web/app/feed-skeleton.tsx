const ROW_COUNT = 10;

export default function FeedSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading transfers</span>
      <div className="h-6.5" />
      <div aria-hidden>
        <div className="hidden border-b border-line pb-2 sm:block">
          <div className="h-4" />
        </div>
        <ul className="divide-y divide-line">
          {Array.from({ length: ROW_COUNT }, (_, index) => (
            <li key={index} className="py-2">
              <div className="flex h-10 items-center sm:h-5">
                <div className="h-3 w-full animate-pulse rounded bg-subtle" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
