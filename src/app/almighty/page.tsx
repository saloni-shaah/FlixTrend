"use client";

import { Chat } from "@/components/chat/chat";

export default function AlmightyPage() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-transparent"
    >
      <main className="flex h-full w-full items-center justify-center p-4 md:p-6">
        <Chat />
      </main>
    </div>
  );
}