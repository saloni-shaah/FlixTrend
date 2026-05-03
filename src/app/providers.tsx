
"use client";

import AppNavBar from "./AppNavBar";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';
import BodyStyling from "./BodyStyling";
import { FirebaseErrorDebugger } from "@/firebase/error-debugger";
import { UserLikesProvider } from "@/context/UserLikesContext";

// Dynamically import AppStateProvider with SSR disabled
const AppStateProvider = dynamic(
  () => import('@/utils/AppStateContext').then((mod) => mod.AppStateProvider),
  { ssr: false }
);

// Dynamically import MusicPlayerProvider with SSR disabled
const MusicPlayerProvider = dynamic(
  () => import('@/utils/MusicPlayerContext').then((mod) => mod.MusicPlayerProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AppStateProvider>
          <UserLikesProvider>
            <MusicPlayerProvider>
              <BodyStyling />
              <FirebaseErrorListener />
              <Toaster />
              <main className="pb-20 pt-6 px-4">{children}</main>
              <GlobalMusicPlayer />
              <AppNavBar />
            </MusicPlayerProvider>
          </UserLikesProvider>
        </AppStateProvider>
    )
}
