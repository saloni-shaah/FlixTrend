"use client";
import React from 'react';

export function VibeJumper() {
    // This is a placeholder for our first game.
    // We will build out the full game logic here in the next steps.
    return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4">
            <h2 className="text-3xl font-headline font-bold text-accent-cyan">Vibe Jumper</h2>
            <p className="text-gray-400 mt-2">Coming Soon!</p>
            <div className="mt-8 text-6xl animate-bounce">
                👟
            </div>
            <div className="absolute bottom-4 text-xs text-gray-600">
                <p>Game engine and high score logic will be built here.</p>
            </div>
        </div>
    );
}
