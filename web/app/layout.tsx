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
      <body>
        <header className="border-b border-gray-200">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
            <span className="font-semibold">Wallet activity</span>
            {networkName && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{networkName}</span>
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
