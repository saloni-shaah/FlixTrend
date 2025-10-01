"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, BrainCircuit, RefreshCw, Star } from 'lucide-react';
import { FaReact, FaNodeJs, FaGoogle, FaApple, FaAndroid, FaFigma } from 'react-icons/fa';

const ICONS = [
  <FaReact key="1" />, <FaNodeJs key="2" />, <FaGoogle key="3" />, <FaApple key="4" />, <FaAndroid key="5" />, <FaFigma key="6" />,
];
const GAME_SIZE = 12; // Must be an even number

const shuffleArray = (array: any[]) => {
  return array.map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

const generateCards = () => {
    const icons = ICONS.slice(0, GAME_SIZE / 2);
    const duplicatedIcons = [...icons, ...icons];
    return shuffleArray(duplicatedIcons.map((icon, index) => ({
      id: index,
      icon: icon,
      isFlipped: false,
      isMatched: false,
    })));
};

type CardType = {
    id: number;
    icon: React.ReactNode;
    isFlipped: boolean;
    isMatched: boolean;
}

export function FlashMatch() {
    const [cards, setCards] = useState<CardType[]>(generateCards());
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        if (flippedCards.length === 2) {
            const [firstIndex, secondIndex] = flippedCards;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if ((firstCard.icon as any).key === (secondCard.icon as any).key) {
                // Match
                setCards(prev => prev.map(card => 
                    (card.id === firstCard.id || card.id === secondCard.id) ? { ...card, isMatched: true } : card
                ));
                setFlippedCards([]);
            } else {
                // No match
                setTimeout(() => {
                    setCards(prev => prev.map(card => 
                       (card.id === firstCard.id || card.id === secondCard.id) ? { ...card, isFlipped: false } : card
                    ));
                    setFlippedCards([]);
                }, 1000);
            }
             setMoves(m => m + 1);
        }
    }, [flippedCards, cards]);
    
    useEffect(() => {
        if (cards.length > 0 && cards.every(card => card.isMatched)) {
            setGameOver(true);
        }
    }, [cards])

    const handleCardClick = (index: number) => {
        if (flippedCards.length < 2 && !cards[index].isFlipped) {
            setCards(prev => prev.map((card, i) => i === index ? { ...card, isFlipped: true } : card));
            setFlippedCards(prev => [...prev, index]);
        }
    };
    
    const resetGame = () => {
        setCards(generateCards());
        setFlippedCards([]);
        setMoves(0);
        setGameOver(false);
    }

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white p-4 font-body relative overflow-hidden gap-6">
            <h2 className="text-3xl font-headline font-bold text-accent-cyan">Flash Match</h2>
            
            <div className="flex gap-8 text-center">
                <div>
                    <p className="text-gray-400 text-sm">Moves</p>
                    <p className="text-2xl font-bold text-brand-gold">{moves}</p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 w-full max-w-sm">
                {cards.map((card, index) => (
                    <div key={card.id} className="aspect-square" onClick={() => handleCardClick(index)}>
                        <motion.div
                            className="w-full h-full relative"
                            style={{ transformStyle: 'preserve-3d' }}
                            animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 w-full h-full bg-accent-pink/20 rounded-lg flex items-center justify-center cursor-pointer" style={{ backfaceVisibility: 'hidden' }}>
                                <BrainCircuit className="text-accent-pink" />
                            </div>
                            {/* Back */}
                            <div 
                                className={`absolute inset-0 w-full h-full rounded-lg flex items-center justify-center text-4xl ${card.isMatched ? 'bg-green-500/20' : 'bg-accent-cyan/20'}`} 
                                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                            >
                                {card.icon}
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
            
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center text-center p-4"
                    >
                         <Award className="text-brand-gold mb-4" size={64}/>
                        <h2 className="text-4xl font-headline font-bold text-brand-gold">You Won!</h2>
                        <p className="text-lg mt-2">You completed the game in <span className="font-bold text-accent-cyan">{moves}</span> moves.</p>
                        <button onClick={resetGame} className="btn-glass bg-accent-pink text-white mt-8 flex items-center gap-2">
                            <RefreshCw/> Play Again
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
