"use client";

import AppNavBar from "./AppNavBar";
import { AppStateProvider } from "@/utils/AppStateContext";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import Script from "next/script";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { Toaster } from "@/components/ui/toaster";

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
