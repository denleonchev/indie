"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useOptimistic, useTransition } from "react";

type FeedNavigation = {
  pendingHref: string | null;
  navigate: (href: string) => void;
};

const FeedNavigationContext = createContext<FeedNavigation>({ pendingHref: null, navigate: () => {} });

export function FeedNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useOptimistic<string | null>(null);

  function navigate(href: string) {
    startTransition(() => {
      setPendingHref(href);
      router.push(href);
    });
  }

  return <FeedNavigationContext value={{ pendingHref, navigate }}>{children}</FeedNavigationContext>;
}

export function useFeedNavigation() {
  return useContext(FeedNavigationContext);
}

export function FeedPending({ children }: { children: React.ReactNode }) {
  const pending = useFeedNavigation().pendingHref !== null;
  return (
    <div
      aria-busy={pending}
      className={`flex flex-col gap-4 ${pending ? "pointer-events-none opacity-40 transition-opacity delay-150" : ""}`}
    >
      {children}
    </div>
  );
}

export type FilterOption = { href: string; label: string; active: boolean };

export function FeedLink({ href, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const { navigate } = useFeedNavigation();
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(href);
      }}
    />
  );
}

export function FilterGroup({ options }: { options: FilterOption[] }) {
  const { pendingHref } = useFeedNavigation();
  const pendingInGroup = options.some(({ href }) => href === pendingHref);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ href, label, active }) => {
        const shownActive = pendingInGroup ? href === pendingHref : active;
        return (
          <FeedLink
            key={href}
            href={href}
            aria-current={shownActive ? "true" : undefined}
            className={`rounded border px-2 py-0.5 ${shownActive ? "border-strong font-semibold" : "border-control text-muted"}`}
          >
            {label}
          </FeedLink>
        );
      })}
    </div>
  );
}
