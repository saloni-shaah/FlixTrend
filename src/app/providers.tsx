"use client";

import AppNavBar from "./AppNavBar";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';

// Dynamically import AppStateProvider with SSR disabled
const AppStateProvider = dynamic(
  () => import('@/utils/AppStateContext').then((mod) => mod.AppStateProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AppStateProvider>
          <FirebaseErrorListener />
          <Toaster />
          <main className="pb-20 pt-6 px-4">{children}</main>
          <GlobalMusicPlayer />
          <AppNavBar />
        </AppStateProvider>
    )
}
