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
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4402800926226975"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="relative min-h-screen">
        <AppStateProvider>
          <main className="pb-20 pt-6 px-4">
            {children}
          </main>
          <GlobalMusicPlayer />
          <AppNavBar />
        </AppStateProvider>
      </body>
    </html>
  );
}
