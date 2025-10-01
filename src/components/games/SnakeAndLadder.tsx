
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice6, User, Award, Play } from 'lucide-react';

const BOARD_SIZE = 100;
const SNAKES: { [key: number]: number } = {
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79,
};
const LADDERS: { [key: number]: number } = {
  4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
};

type GameStatus = 'waiting' | 'playing' | 'gameOver';

export function SnakeAndLadder() {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [playerPosition, setPlayerPosition] = useState(1);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [message, setMessage] = useState('Roll the dice to start!');

  const renderBoard = () => {
    const cells = [];
    for (let i = BOARD_SIZE; i >= 1; i--) {
      const isEvenRow = Math.floor((i - 1) / 10) % 2 === 0;
      const cellIndex = isEvenRow ? BOARD_SIZE - Math.floor((i-1)/10)*10 - ((i-1)%10) : i;

      let cellContent = <span className="font-bold text-xs">{cellIndex}</span>;
      if(playerPosition === cellIndex) {
        cellContent = <User className="text-white z-10" size={24}/>
      }
      if(SNAKES[cellIndex]) {
        cellContent = <>{cellContent} <span className="absolute text-2xl z-0 opacity-50">🐍</span></>;
      }
      if(LADDERS[cellIndex]) {
         cellContent = <>{cellContent} <span className="absolute text-2xl z-0 opacity-50">🪜</span></>;
      }
      
      cells.push(
        <div key={cellIndex} className="w-full h-full border border-accent-cyan/20 flex items-center justify-center relative">
          {cellContent}
        </div>
      );
    }
    return cells;
  };
  
  const rollDice = () => {
    if (status === 'gameOver') return;
    if (status === 'waiting') setStatus('playing');
    
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);
    
    let newPosition = playerPosition + roll;
    
    if (newPosition > BOARD_SIZE) {
      setMessage(`You need ${BOARD_SIZE - playerPosition} to win. Try again next turn!`);
      return;
    }
    
    if (SNAKES[newPosition]) {
      const endPosition = SNAKES[newPosition];
      setMessage(`Oh no! A snake at ${newPosition} took you down to ${endPosition}.`);
      newPosition = endPosition;
    } else if (LADDERS[newPosition]) {
      const endPosition = LADDERS[newPosition];
      setMessage(`Wow! A ladder at ${newPosition} takes you up to ${endPosition}!`);
      newPosition = endPosition;
    } else {
      setMessage(`You rolled a ${roll} and moved to ${newPosition}.`);
    }

    setPlayerPosition(newPosition);

    if (newPosition === BOARD_SIZE) {
      setStatus('gameOver');
      setMessage('You Won! 🎉');
    }
  };

  const resetGame = () => {
    setStatus('waiting');
    setPlayerPosition(1);
    setDiceResult(null);
    setMessage('Roll the dice to start!');
  };


  return (
    <div className="w-full h-full bg-gray-900 flex flex-col md:flex-row items-center justify-center text-white p-4 font-body relative overflow-hidden gap-8">
      {/* Game Board */}
      <div className="grid grid-cols-10 grid-rows-10 w-full max-w-lg aspect-square border-4 border-accent-cyan rounded-lg">
        {renderBoard()}
      </div>

      {/* Controls & Info */}
      <div className="w-full md:w-64 flex flex-col items-center gap-6">
        <h2 className="text-3xl font-headline font-bold text-accent-cyan">Snake & Ladder</h2>
        
        <div className="text-center">
            <p className="text-gray-400">Current Position</p>
            <p className="text-4xl font-bold text-brand-gold">{playerPosition}</p>
        </div>

        <button 
            onClick={rollDice}
            className="btn-glass bg-accent-pink text-white flex items-center gap-3 text-lg disabled:opacity-50"
            disabled={status === 'gameOver'}
        >
            <Dice6 /> Roll Dice
        </button>
        
        {diceResult && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <p className="text-gray-400">You Rolled</p>
                <p className="text-5xl font-bold text-white">{diceResult}</p>
            </motion.div>
        )}

        <div className="text-center text-accent-cyan p-3 bg-black/20 rounded-lg min-h-[60px]">
            {message}
        </div>
        
        {status === 'gameOver' && (
             <button onClick={resetGame} className="btn-glass bg-accent-green text-black">Play Again</button>
        )}
      </div>
    </div>
  );
}
