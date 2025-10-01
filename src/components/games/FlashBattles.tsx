"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft, Construction } from 'lucide-react';
import { VibeJumper } from '@/components/games/VibeJumper';
import { OfflineDinoRun } from '@/components/games/OfflineDinoRun';
import { SnakeAndLadder } from '@/components/games/SnakeAndLadder';
import { ChessGame } from '@/components/games/Chess';
import { FlashMatch } from '@/components/games/FlashMatch';
import { ScopeSlider } from '@/components/games/ScopeSlider';
import { EchoChamber } from '@/components/games/EchoChamber';
import { GlitchGrid } from '@/components/games/GlitchGrid';


const ComingSoonComponent = () => (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4">
        <Construction size={64} className="text-accent-cyan mb-4" />
        <h2 className="text-3xl font-headline font-bold text-accent-cyan">Coming Soon!</h2>
        <p className="text-gray-400 mt-2">This game is under construction. Check back later!</p>
    </div>
);


// This will be the list of all our games
const gamesList = [
    // Existing Games
    { id: 'vibe-jumper', name: 'Vibe Jumper', component: VibeJumper, description: "An endless jumper where you hop on trending hashtag clouds." },
    { id: 'offline-dino-run', name: 'Offline Dino Run', component: OfflineDinoRun, description: "The classic offline game, but with the FlixTrend logo." },
    { id: 'snake-and-ladder', name: 'Snake & Ladder', component: SnakeAndLadder, description: "Climb the ladders and dodge the snakes in this classic board game." },
    { id: 'chess', name: 'Chess', component: ChessGame, description: "The classic strategy game. Play against a friend locally." },
    { id: 'flash-match', name: 'Flash Match', component: FlashMatch, description: "A fast-paced tile-matching game with brand icons." },
    { id: 'scope-slider', name: 'Scope Slider', component: ScopeSlider, description: "A sliding puzzle game using images from popular posts." },
    { id: 'echo-chamber', name: 'Echo Chamber', component: EchoChamber, description: 'A "Simon Says" memory game with color patterns.' },
    { id: 'glitch-grid', name: 'Glitch Grid', component: GlitchGrid, description: "A 2048-style game with social media icons." },
];

export function GamesHub() {
    const [selectedGame, setSelectedGame] = useState<any | null>(null);

    const handleSelectGame = (game: any) => {
        setSelectedGame(game);
    };

    if (selectedGame) {
        const GameComponent = selectedGame.component || ComingSoonComponent;
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
                        className={`glass-card p-6 flex flex-col items-center text-center transition-all ${!game.component ? 'opacity-50' : 'cursor-pointer hover:border-accent-green'}`}
                        whileHover={game.component ? { y: -5 } : {}}
                        onClick={() => game.component && handleSelectGame(game)}
                    >
                        <Gamepad2 size={40} className={!game.component ? "text-gray-500 mb-3" : "text-accent-green mb-3"}/>
                        <h3 className={`text-xl font-bold font-headline ${!game.component ? 'text-gray-500' : 'text-accent-cyan'}`}>{game.name}</h3>
                        <p className="text-sm text-gray-400 mt-2 flex-1">{game.description}</p>
                        {!game.component && <p className="text-xs font-bold text-accent-purple mt-4">Coming Soon</p>}
                    </motion.div>
                ))}
            </div>

        </motion.div>
    );
}