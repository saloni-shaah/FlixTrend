
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // The main Almighty chat is now integrated into the Signal page.
    // Redirect any visits to this standalone page there.
    router.replace('/signal');
  }, [router]);

  return (
    <div
      className="flex h-full w-full items-center justify-center bg-background"
    >
        <p>Redirecting to chat...</p>
    </div>
  );
}
