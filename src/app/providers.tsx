"use client";

import AppNavBar from "./AppNavBar";
import { GlobalMusicPlayer } from "@/components/GlobalMusicPlayer";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';
import BodyStyling from "./BodyStyling";
import { FirebaseErrorDebugger } from "@/firebase/error-debugger";
import { useEffect, useState } from "react";
import { app } from "@/utils/firebaseClient";
import { UserLikesProvider } from "@/context/UserLikesContext"; // Import the UserLikesProvider

// Dynamically import AppStateProvider with SSR disabled
const AppStateProvider = dynamic(
  () => import('@/utils/AppStateContext').then((mod) => mod.AppStateProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
    const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);

    useEffect(() => {
        const checkFirebase = async () => {
            try {
                await app.options;
                setIsFirebaseInitialized(true);
            } catch (error) {
                console.error("Firebase initialization failed:", error);
            }
        };

        checkFirebase();
    }, []);

    if (!isFirebaseInitialized) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    return (
        <AppStateProvider>
          <UserLikesProvider> {/* Wrap with UserLikesProvider */}
            <BodyStyling />
            <FirebaseErrorListener />
            <Toaster />
            <main className="pb-20 pt-6 px-4">{children}</main>
            <GlobalMusicPlayer />
            <AppNavBar />
          </UserLikesProvider>
        </AppStateProvider>
    )
}
