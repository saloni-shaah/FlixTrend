import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AppNavBar from "./AppNavBar";

export const metadata: Metadata = {
  title: "FlixTrend",
  description: "Where Trends Find You First",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-primary">
        {children}
        <AppNavBar />
      </body>
    </html>
  );
}

function NavButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center text-xs text-gray-300 hover:text-accent-cyan transition-all">
      <span className="text-2xl mb-1">{icon}</span>
      {label}
    </Link>
  );
}
