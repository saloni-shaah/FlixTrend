"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { TicTacToe } from './games/TicTacToe';
import { Snake } from './games/Snake';
import { Game2048 } from './games/2048';
import { Match3 } from './games/Match3';
import { BrickBreaker } from './games/BrickBreaker';
import { CricketChallenge } from './games/CricketChallenge';
import AdModal from './AdModal';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { GamePlayer } from './GamePlayer';

const db = getFirestore(app);


const games = [
    {
        id: 'tic-tac-toe',
        name: "Tic-Tac-Toe",
        description: "The classic offline and online game. Challenge a friend to a match.",
        component: TicTacToe
    },
    {
        id: 'snake',
        name: "Snake",
        description: "A timeless arcade classic. Guide the snake to eat the food and grow longer, but don't hit the walls or yourself!",
        component: Snake
    },
    {
        id: '2048',
        name: "2048",
        description: "An addictive puzzle game. Swipe to slide tiles and combine them to reach the 2048 tile!",
        component: Game2048
    },
    {
        id: 'match3',
        name: "Match-3 Madness",
        description: "A colorful and addictive gem-matching puzzle game with levels and objectives.",
        component: Match3
    },
    {
        id: 'brick-breaker',
        name: "Brick Breaker",
        description: "A classic arcade challenge. Break all the bricks with the ball and paddle to clear levels.",
        component: BrickBreaker
    },
    {
        id: 'cricket-challenge',
        name: "Super Over Challenge",
        description: "A fast-paced cricket batting game. Choose your team and format, and score as many runs as you can!",
        component: CricketChallenge
    }
];

export function GamesHub() {
    const [activeGame, setActiveGame] = useState<any>(null);
    const [showAd, setShowAd] = useState(false);
    const [gameToStart, setGameToStart] = useState<any>(null);
    const [developerGames, setDeveloperGames] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setDeveloperGames(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isDevGame: true })));
        });
        return () => unsub();
    }, []);

    const handleSelectGame = (game: any) => {
        setGameToStart(game);
        setShowAd(true);
    }
    
    const startGame = () => {
        setShowAd(false);
        if(gameToStart) {
            setActiveGame(gameToStart);
            setGameToStart(null);
        }
    }

    if (activeGame) {
        const GameComponent = activeGame.component;
        return (
             <div className="w-full flex flex-col items-center">
                <button onClick={() => setActiveGame(null)} className="btn-glass self-start mb-4 flex items-center gap-2">
                    <ArrowLeft size={16}/> Back to Games
                </button>
                 {activeGame.isDevGame ? <GamePlayer game={activeGame} onBack={() => setActiveGame(null)} /> : <GameComponent />}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center">
             {showAd && (
                <AdModal onComplete={startGame} />
            )}
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-8">
                Community Games
            </h2>

            <p className="text-center text-gray-400 mb-12 max-w-2xl">
                Challenge a friend, play a quick game solo, or explore games made by other developers in the community!
            </p>

            <div className="w-full space-y-12">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                     <h3 className="text-xl font-bold text-accent-cyan mb-4">FlixTrend Classics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games.map(game => (
                            <motion.div
                                key={game.id}
                                className="glass-card p-6 flex flex-col gap-3 hover:border-accent-cyan transition-colors duration-300 cursor-pointer"
                                whileHover={{ y: -5 }}
                                onClick={() => handleSelectGame(game)}
                            >
                                <Gamepad2 className="text-accent-pink" />
                                <h4 className="font-bold text-lg text-accent-cyan">{game.name}</h4>
                                <p className="text-sm text-gray-400 flex-1">{game.description}</p>
                                <div className="text-right text-xs font-bold text-accent-pink">Play Now &rarr;</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                 <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                     <h3 className="text-xl font-bold text-accent-cyan mb-4">Developer Showcase</h3>
                     {developerGames.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {developerGames.map(game => (
                                <motion.div
                                    key={game.id}
                                    className="glass-card p-6 flex flex-col gap-3 hover:border-accent-green transition-colors duration-300 cursor-pointer"
                                    whileHover={{ y: -5 }}
                                    onClick={() => handleSelectGame(game)}
                                >
                                    <Gamepad2 className="text-accent-green" />
                                    <h4 className="font-bold text-lg text-accent-green">{game.title}</h4>
                                    <p className="text-sm text-gray-400 flex-1">{game.description}</p>
                                    <div className="text-right text-xs font-bold text-accent-green">Play Now &rarr;</div>
                                </motion.div>
                            ))}
                         </div>
                     ) : <p className="text-gray-500 text-center">No developer games have been published yet.</p>}
                 </motion.section>
            </div>
        </div>
    );
}
