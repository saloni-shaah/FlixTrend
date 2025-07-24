"use client";
import { useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle magic link or email confirmation
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is confirmed and logged in, redirect to home
        router.push("/home");
      } else {
        // Not confirmed or error
        // Optionally show a message or redirect
      }
    });
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-accent-cyan">
      Confirming your account...
    </div>
  );
} 