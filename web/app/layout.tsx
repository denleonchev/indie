import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indie",
  description: "Wallet activity",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
