
"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { TicTacToe } from './games/TicTacToe';
import { Snake } from './games/Snake';
import { Game2048 } from './games/2048';
import { Match3 } from './games/Match3';
import { BrickBreaker } from './games/BrickBreaker';
import { CricketChallenge } from './games/CricketChallenge';
import { Chess } from './games/Chess';

const games = [
    {
        id: 'chess',
        name: "Chess",
        description: "A classic two-player chess match on one device. Play offline with legal moves, check, and checkmate.",
        component: Chess
    },
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category') || '';
    const gameSlug = category.startsWith('games/') ? category.slice('games/'.length) : '';
    const activeGame = games.find(game => game.id === gameSlug);

    const handleSelectGame = (game: typeof games[number]) => {
        router.push(`/flix?category=games/${game.id}`, { scroll: false });
    };

    if (activeGame) {
        const GameComponent = activeGame.component;
        return (
             <div className="w-full flex flex-col items-center">
                <button onClick={() => router.push('/flix?category=games', { scroll: false })} className="btn-glass self-start mb-4 flex items-center gap-2">
                    <ArrowLeft size={16}/> Back to Games
                </button>
                <GameComponent />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-8">
                Community Games
            </h2>

            <p className="text-center text-gray-400 mb-12 max-w-2xl">
                Challenge a friend or play a quick game solo with these FlixTrend classics!
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
                            <motion.button
                                type="button"
                                key={game.id}
                                className="glass-card p-6 flex flex-col gap-3 text-left hover:border-accent-cyan transition-colors duration-300"
                                whileHover={{ y: -5 }}
                                onClick={() => handleSelectGame(game)}
                            >
                                <Gamepad2 className="text-accent-pink" />
                                <h4 className="font-bold text-lg text-accent-cyan">{game.name}</h4>
                                <p className="text-sm text-gray-400 flex-1">{game.description}</p>
                                <div className="text-right text-xs font-bold text-accent-pink">Play Now &rarr;</div>
                            </motion.button>
                        ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
