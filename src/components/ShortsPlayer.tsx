"use client";

// This component is DEPRECATED and will be removed.
// All its functionality has been superseded by the new advanced video player.

import React from "react";

export function ShortsPlayer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold">Shorts Player is being upgraded!</h2>
        <p className="text-gray-400">This feature is now part of our new advanced video player.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-accent-pink">
          Go Back
        </button>
      </div>
    </div>
  );
}
