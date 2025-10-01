"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Play, RotateCw, Puzzle } from 'lucide-react';
import { getFirestore, collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { OptimizedImage } from '../OptimizedImage';

const db = getFirestore(app);
const GRID_SIZE = 3; // 3x3 grid for a classic 8-puzzle

type GameStatus = 'waiting' | 'playing' | 'solved';
type Tile = number | null;

// Function to create a solvable puzzle
const createSolvableGrid = (): Tile[] => {
    let grid: Tile[];
    do {
        grid = Array.from({ length: GRID_SIZE * GRID_SIZE - 1 }, (_, i) => i + 1)
                    .concat(null) // Add the empty tile
                    .sort(() => Math.random() - 0.5); // Shuffle
    } while (!isSolvable(grid));
    return grid;
};

// Check if the puzzle is solvable using inversion count
const isSolvable = (grid: Tile[]): boolean => {
    let inversions = 0;
    const flatGrid = grid.filter(t => t !== null); // Remove null for calculation
    for (let i = 0; i < flatGrid.length; i++) {
        for (let j = i + 1; j < flatGrid.length; j++) {
            if (flatGrid[i]! > flatGrid[j]!) {
                inversions++;
            }
        }
    }
    // For a 3x3 grid, the number of inversions must be even.
    return inversions % 2 === 0;
};

const isSolved = (grid: Tile[]) => {
    for (let i = 0; i < grid.length - 1; i++) {
        if (grid[i] !== i + 1) return false;
    }
    return grid[grid.length - 1] === null;
};


export function ScopeSlider() {
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [moves, setMoves] = useState(0);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch a popular image to use for the puzzle
        const fetchImage = async () => {
            const q = query(
                collection(db, "posts"),
                where("type", "==", "media"),
                orderBy("createdAt", "desc"),
                limit(20) // Fetch a few recent media posts
            );
            const snap = await getDocs(q);
            const imagePosts = snap.docs
                .map(d => d.data())
                .filter(p => p.mediaUrl && !Array.isArray(p.mediaUrl) && !p.mediaUrl.includes('.mp4'));

            if (imagePosts.length > 0) {
                 // Pick a random one from the fetched posts
                const randomPost = imagePosts[Math.floor(Math.random() * imagePosts.length)];
                setImageUrl(randomPost.mediaUrl);
            } else {
                // Fallback image if no posts are found
                setImageUrl('https://picsum.photos/seed/scopeslider/600/600');
            }
        }
        fetchImage();
    }, []);
    
    const startGame = () => {
        setTiles(createSolvableGrid());
        setMoves(0);
        setStatus('playing');
    }

    const handleTileClick = (index: number) => {
        if (status !== 'playing') return;

        const emptyIndex = tiles.indexOf(null);
        if (emptyIndex === -1) return;

        const { row, col } = { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
        const { emptyRow, emptyCol } = { row: Math.floor(emptyIndex / GRID_SIZE), col: emptyIndex % GRID_SIZE };

        // Check if the clicked tile is adjacent to the empty tile
        const isAdjacent = (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;

        if (isAdjacent) {
            const newTiles = [...tiles];
            [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]]; // Swap
            setTiles(newTiles);
            setMoves(prev => prev + 1);

            if (isSolved(newTiles)) {
                setStatus('solved');
            }
        }
    };
    
    const TileComponent = ({ value, index }: { value: Tile, index: number }) => {
        if (value === null) {
            return <div className="w-full h-full bg-black/50" />;
        }
        
        const pieceSize = 100 / (GRID_SIZE -1);
        const bgX = ((value - 1) % GRID_SIZE) * pieceSize;
        const bgY = Math.floor((value - 1) / GRID_SIZE) * pieceSize;

        return (
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full h-full cursor-pointer bg-cover bg-center rounded-md border-2 border-black/20"
                style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: `${GRID_SIZE * 100}%`,
                    backgroundPosition: `${bgX}% ${bgY}%`
                }}
                onClick={() => handleTileClick(index)}
            />
        );
    };

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col md:flex-row items-center justify-center text-white p-4 font-body relative overflow-hidden gap-8">
             <AnimatePresence>
                {status !== 'playing' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center text-center p-4"
                    >
                        {status === 'waiting' ? (
                            <>
                                <Puzzle size={64} className="text-accent-cyan mb-4" />
                                <h2 className="text-4xl font-headline font-bold text-accent-cyan">Scope Slider</h2>
                                <p className="text-gray-400 mt-2 mb-6">Unscramble the image from a popular post!</p>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white flex items-center gap-2"><Play/> Start Game</button>
                            </>
                        ) : ( // solved
                            <>
                                <Award className="text-brand-gold mb-4" size={64} />
                                <h2 className="text-4xl font-headline font-bold text-brand-gold">Solved!</h2>
                                <p className="text-lg mt-2">You solved the puzzle in <span className="font-bold text-accent-cyan">{moves}</span> moves.</p>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white mt-8 flex items-center gap-2"><RotateCw/> Play Again</button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="w-full max-w-sm aspect-square p-2 glass-card">
                 {!imageUrl ? <div className="animate-pulse bg-gray-700 w-full h-full rounded-lg"/> :
                    <div className="grid grid-cols-3 gap-1 w-full h-full">
                        {tiles.map((tile, index) => (
                           <TileComponent key={index} value={tile} index={index}/>
                        ))}
                    </div>
                }
            </div>
            <div className="w-full md:w-64 flex flex-col items-center gap-4">
                <h2 className="text-3xl font-headline font-bold text-accent-cyan">Scope Slider</h2>
                <div className="text-center">
                    <p className="text-gray-400">Moves</p>
                    <p className="text-4xl font-bold text-brand-gold">{moves}</p>
                </div>
                 <div className="text-center mt-4">
                    <h4 className="text-sm font-bold text-gray-500 mb-2">Original Image:</h4>
                    {imageUrl && <img src={imageUrl} alt="Original Puzzle" className="w-32 h-32 rounded-lg border-2 border-accent-cyan/20"/>}
                </div>
            </div>
        </div>
    );
}
