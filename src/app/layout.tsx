import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AppNavBar from "./AppNavBar";
import { AppStateProvider } from "@/utils/AppStateContext";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";

export const metadata: Metadata = {
  title: "FlixTrend",
  description: "Where Trends Find You First",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
