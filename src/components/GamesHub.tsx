"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import { VibeJumper } from './games/VibeJumper';

// This will be the list of all our games
const gamesList = [
    { id: 'vibe-jumper', name: 'Vibe Jumper', component: VibeJumper, description: "An endless jumper where you hop on trending hashtag clouds." },
    // We will add more games here!
];

export function GamesHub() {
    const [selectedGame, setSelectedGame] = useState<any | null>(null);

    const handleSelectGame = (game: any) => {
        setSelectedGame(game);
    };

    if (selectedGame) {
        const GameComponent = selectedGame.component;
        return (
            <div className="w-full h-[80vh] flex flex-col items-center">
                <button 
                    className="btn-glass self-start mb-4 flex items-center gap-2"
                    onClick={() => setSelectedGame(null)}
                >
                    <ArrowLeft size={16}/> Back to Games
                </button>
                <div className="w-full h-full glass-card overflow-hidden">
                    <GameComponent />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl"
        >
            <div className="text-center mb-12">
                <Gamepad2 size={64} className="mx-auto text-accent-green mb-4" />
                <h2 className="text-4xl font-headline text-accent-green">Games Hub</h2>
                <p className="text-gray-400 mt-2">Your space for offline fun, AI challenges, and multiplayer battles.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gamesList.map(game => (
                    <motion.div 
                        key={game.id}
                        className="glass-card p-6 flex flex-col items-center text-center cursor-pointer hover:border-accent-green"
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectGame(game)}
                    >
                        <Gamepad2 size={40} className="text-accent-green mb-3"/>
                        <h3 className="text-xl font-bold font-headline text-accent-cyan">{game.name}</h3>
                        <p className="text-sm text-gray-400 mt-2">{game.description}</p>
                    </motion.div>
                ))}
                 <motion.div 
                    className="glass-card p-6 flex flex-col items-center text-center border-2 border-dashed border-gray-600"
                >
                    <Gamepad2 size={40} className="text-gray-500 mb-3"/>
                    <h3 className="text-xl font-bold font-headline text-gray-500">Coming Soon...</h3>
                    <p className="text-sm text-gray-600 mt-2">49 more games are on the way, including Ludo, Snake & Ladder, and AR experiences!</p>
                </motion.div>
            </div>

        </motion.div>
    );
}
