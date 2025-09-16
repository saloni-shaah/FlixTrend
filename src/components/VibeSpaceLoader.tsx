
"use client";
import React from 'react';
import { FlixTrendLogo } from './FlixTrendLogo';

export function VibeSpaceLoader() {
  return (
    <div className="relative w-full h-96 flex flex-col items-center justify-center text-center overflow-hidden rounded-2xl bg-black/50 p-4">
      <div className="relative z-10 flex flex-col items-center justify-center">
        <FlixTrendLogo size={80} />
        <h1 className="text-3xl font-headline text-accent-cyan font-bold mt-4 animate-glow">
          FlixTrend
        </h1>
        <p className="mt-4 text-sm text-gray-400 max-w-sm animate-pulse">
          Loading the latest vibes from across the universe...
        </p>
      </div>
    </div>
  );
}
