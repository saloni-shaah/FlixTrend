
"use client";

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from "@/hooks/use-toast";

/**
 * A client-side component that listens for Firestore permission errors
 * and displays them using a toast notification. This is crucial for
 * debugging security rules during development.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error);

      // Display a detailed toast notification for developers.
      // This provides immediate feedback on why a request was denied.
      toast({
        variant: "destructive",
        title: "Firestore Security Rule Denied",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white whitespace-pre-wrap">{error.message}</code>
          </pre>
        ),
        duration: 20000, // Give developers ample time to read it
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything itself.
}
