
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AppNavBar from "./AppNavBar";
import { AppStateProvider } from "@/utils/AppStateContext";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import Script from "next/script";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { Toaster } from "@/components/ui/toaster";


export const metadata: Metadata = {
  title: "FlixTrend",
  description: "Where Trends Find You First",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1B1B1E" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Space+Grotesk:wght@700&family=Italianno&family=Dancing+Script:wght@400..700&family=Great+Vibes&display=swap" rel="stylesheet" />
        {/* Load Google Pay script */}
        <script src="https://pay.google.com/gp/p/js/pay.js" async></script>
      </head>
      <body className="relative min-h-screen">
        <AppStateProvider>
          <FirebaseErrorListener />
          <Toaster />
          <main className="pb-20 pt-6 px-4">{children}</main>
          <GlobalMusicPlayer />
          <AppNavBar />
        </AppStateProvider>
        {/* Load our custom payment logic script */}
        <Script src="/payment.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
