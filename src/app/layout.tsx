<<<<<<< HEAD

=======
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
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

<<<<<<< HEAD
export default function RootLayout({ children }: { children: React.Node }) {
=======
export default function RootLayout({ children }: { children: React.ReactNode }) {
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
  return (
    <html lang="en">
      <body className="relative min-h-screen">
        <AppStateProvider>
<<<<<<< HEAD
          <main className="pb-20 pt-6 px-4">
=======
          <main className="pb-40">
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
            {children}
          </main>
          <GlobalMusicPlayer />
          <AppNavBar />
        </AppStateProvider>
      </body>
    </html>
  );
}
