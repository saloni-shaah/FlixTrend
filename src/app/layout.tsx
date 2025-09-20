
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AppNavBar from "./AppNavBar";
import { AppStateProvider } from "@/utils/AppStateContext";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import Script from "next/script";

export const metadata: Metadata = {
  title: "FlixTrend",
  description: "Where Trends Find You First",
  other: {
    "google-adsense-account": "ca-pub-4402800926226975",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Space+Grotesk:wght@700&family=Italianno&family=Dancing+Script:wght@400..700&family=Great+Vibes&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4402800926226975"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="relative min-h-screen">
        <AppStateProvider>
          <main className="pb-20 pt-6 px-4">{children}</main>
          <GlobalMusicPlayer />
          <AppNavBar />
        </AppStateProvider>
      </body>
    </html>
  );
}
