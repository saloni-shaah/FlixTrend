import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AppNavBar from "./AppNavBar";
import { AppStateProvider } from "@/utils/AppStateContext";

export const metadata: Metadata = {
  title: "FlixTrend",
  description: "Where Trends Find You First",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-primary">
        <AppStateProvider>
          {children}
          <AppNavBar />
        </AppStateProvider>
      </body>
    </html>
  );
}
