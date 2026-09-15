import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Link from "next/link";
import NextTopLoader from "nextjs-toploader";

import { Providers } from "@/app/providers";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

import Brand from "./brand";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  preload: false,
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
  preload: false,
});

export const metadata: Metadata = {
  title: "Wager",
  description: "Find a pickup game, pay your share, and play.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(barlow.variable, barlowCondensed.variable)}>
      <body className="font-sans">
        <Providers>
          <NextTopLoader color="#f2c230" height={4} showSpinner={false} />
          <header className="bg-asphalt text-white border-b-4 border-line">
            <div className="mx-auto flex items-center justify-between px-4 py-3 max-w-6xl">
              <Link
                href="/"
                className="flex gap-x-2 items-center font-display text-3xl font-bold"
              >
                <Brand />
                Wager
              </Link>
              <UserMenu />
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
