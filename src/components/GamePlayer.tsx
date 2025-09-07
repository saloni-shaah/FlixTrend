
"use client";

import { ArrowLeft } from "lucide-react";
import React from "react";

export function GamePlayer({ game, onBack }: { game: any; onBack: () => void }) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <div>
            <h2 className="text-2xl font-headline font-bold text-accent-cyan">{game.title}</h2>
            <p className="text-sm text-gray-400">by {game.username}</p>
        </div>
        <button className="btn-glass flex items-center gap-2" onClick={onBack}>
          <ArrowLeft size={16}/> Back to Games
        </button>
      </div>
      <div className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden border-2 border-accent-cyan">
        <iframe
          src={game.gameUrl}
          sandbox="allow-scripts allow-same-origin" // Security: This is crucial. It isolates the iframe content.
          className="w-full h-full border-0"
          title={game.title}
        />
      </div>
       <p className="text-center text-gray-400 mt-4 max-w-4xl">{game.description}</p>
    </div>
  );
}
