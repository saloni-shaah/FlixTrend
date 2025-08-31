"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SpaceInvadersGame } from './SpaceInvadersGame';

const games = [
    { id: 'space-invaders', name: 'Space Invaders', description: 'Classic arcade shooter. Defend the earth!', component: <SpaceInvadersGame /> },
    // Add more games here in the future
];

export function GamesHub() {
    const [selectedGame, setSelectedGame] = useState<React.ReactNode | null>(null);

    if (selectedGame) {
        return (
            <div className="w-full h-[70vh] flex flex-col items-center">
                 <button className="btn-glass mb-4" onClick={() => setSelectedGame(null)}>Back to Games</button>
                {selectedGame}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-8">Games Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map(game => (
                    <motion.div
                        key={game.id}
                        className="glass-card p-6 flex flex-col items-center text-center cursor-pointer hover:border-accent-cyan"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedGame(game.component)}
                    >
                        <div className="text-4xl mb-4">👾</div>
                        <h3 className="font-headline text-xl font-bold mb-2 text-accent-cyan">{game.name}</h3>
                        <p className="text-sm text-gray-400">{game.description}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
