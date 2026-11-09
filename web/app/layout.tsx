import type { Metadata } from "next";
import { Suspense } from "react";
import Account from "./account";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wallet activity",
  description: "ERC-20 transfers of the listed tokens",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const networkName = process.env.NEXT_PUBLIC_NETWORK_NAME;
  return (
    <html lang="en">
      <body className="bg-page text-fg">
        <header className="sticky top-0 z-20 border-b border-line bg-page">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
            <span className="font-semibold">Wallet activity</span>
            {networkName && (
              <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">{networkName}</span>
            )}
            <div className="ml-auto">
              <Suspense fallback={null}>
                <Account />
              </Suspense>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
