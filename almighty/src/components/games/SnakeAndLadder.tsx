"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice6, User, Award, Play, RotateCw } from 'lucide-react';

const BOARD_SIZE = 100;
const SNAKES: { [key: number]: number } = {
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79,
};
const LADDERS: { [key: number]: number } = {
  4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
};

type Player = { id: number; position: number; color: string; icon: React.ReactNode };
type GameStatus = 'waiting' | 'playing' | 'gameOver';

export function SnakeAndLadder() {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [message, setMessage] = useState('Roll the dice to start!');
  const [winner, setWinner] = useState<Player | null>(null);
  
  useEffect(() => {
    if (status === 'waiting') {
        setPlayers([
            { id: 1, position: 1, color: 'text-accent-pink', icon: <User /> },
            { id: 2, position: 1, color: 'text-accent-cyan', icon: <User /> },
        ]);
        setCurrentPlayerIndex(0);
        setDiceResult(null);
        setWinner(null);
        setMessage('Player 1, roll the dice to start!');
    }
  }, [status]);


  const renderBoard = () => {
    const board = [];
    for (let row = 9; row >= 0; row--) {
      const cells = [];
      for (let col = 0; col < 10; col++) {
        const cellNumber = row * 10 + (row % 2 === 0 ? col + 1 : 10 - col);
        cells.push(
          <div key={cellNumber} className="w-full h-full border border-accent-cyan/20 flex items-center justify-center relative">
            <span className="font-bold text-xs text-gray-500">{cellNumber}</span>
            {players.map(p => p.position === cellNumber && (
                <motion.div key={p.id} layoutId={`player-${p.id}`} className={`absolute ${p.color}`}>{p.icon}</motion.div>
            ))}
          </div>
        );
      }
      board.push(...cells);
    }
    return board;
  };
  
  const rollDice = () => {
    if (status !== 'playing' || winner) return;
    
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);
    
    setPlayers(prevPlayers => {
        const newPlayers = [...prevPlayers];
        const currentPlayer = newPlayers[currentPlayerIndex];
        let newPosition = currentPlayer.position + roll;

        if (newPosition > BOARD_SIZE) {
            setMessage(`Player ${currentPlayer.id} needs ${BOARD_SIZE - currentPlayer.position} to win. Try again next turn!`);
            return newPlayers;
        }

        let tempMessage = `Player ${currentPlayer.id} rolled a ${roll} and moved to ${newPosition}.`;

        if (SNAKES[newPosition]) {
            const endPosition = SNAKES[newPosition];
            tempMessage = `Oh no! A snake at ${newPosition} took Player ${currentPlayer.id} down to ${endPosition}.`;
            newPosition = endPosition;
        } else if (LADDERS[newPosition]) {
            const endPosition = LADDERS[newPosition];
            tempMessage = `Wow! A ladder at ${newPosition} takes Player ${currentPlayer.id} up to ${endPosition}!`;
            newPosition = endPosition;
        }
        
        setMessage(tempMessage);
        currentPlayer.position = newPosition;

        if (newPosition === BOARD_SIZE) {
            setWinner(currentPlayer);
            setStatus('gameOver');
            setMessage(`Player ${currentPlayer.id} Won! 🎉`);
        }
        
        return newPlayers;
    });

    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  };
  
  const startGame = () => {
      setStatus('playing');
  }

  const resetGame = () => {
      setStatus('waiting');
  };


  return (
    <div className="w-full h-full bg-gray-900 flex flex-col md:flex-row items-center justify-center text-white p-4 font-body relative overflow-hidden gap-8">
      <AnimatePresence>
        {status === 'waiting' && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center text-center p-4"
            >
                <h2 className="text-4xl font-headline font-bold text-accent-cyan">Snake & Ladder</h2>
                <p className="text-gray-400 mt-2 mb-6">First to 100 wins! Play with a friend locally.</p>
                <button onClick={startGame} className="btn-glass bg-accent-pink text-white flex items-center gap-2"><Play/> Start Game</button>
            </motion.div>
        )}
      </AnimatePresence>
      {/* Game Board */}
      <div className="relative w-full max-w-lg aspect-square">
        <div className="grid grid-cols-10 grid-rows-10 w-full h-full border-4 border-accent-cyan rounded-lg overflow-hidden">
            {renderBoard()}
        </div>
        {/* Draw Snakes and Ladders */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {Object.entries(SNAKES).map(([start, end]) => {
                const startPos = {x: ((parseInt(start)-1)%10)*10+5, y: (9-Math.floor((parseInt(start)-1)/10))*10+5};
                const endPos = {x: ((end-1)%10)*10+5, y: (9-Math.floor((end-1)/10))*10+5};
                if(Math.floor((parseInt(start)-1)/10)%2 !== 0) startPos.x = 100-startPos.x;
                if(Math.floor((end-1)/10)%2 !== 0) endPos.x = 100-endPos.x;
                return <line key={`s-${start}`} x1={`${startPos.x}%`} y1={`${startPos.y}%`} x2={`${endPos.x}%`} y2={`${endPos.y}%`} stroke="#FF3CAC" strokeWidth="4" markerEnd="url(#snake-head)"/>
            })}
             {Object.entries(LADDERS).map(([start, end]) => {
                const startPos = {x: ((parseInt(start)-1)%10)*10+5, y: (9-Math.floor((parseInt(start)-1)/10))*10+5};
                const endPos = {x: ((end-1)%10)*10+5, y: (9-Math.floor((end-1)/10))*10+5};
                if(Math.floor((parseInt(start)-1)/10)%2 !== 0) startPos.x = 100-startPos.x;
                if(Math.floor((end-1)/10)%2 !== 0) endPos.x = 100-endPos.x;
                return <line key={`l-${start}`} x1={`${startPos.x}%`} y1={`${startPos.y}%`} x2={`${endPos.x}%`} y2={`${endPos.y}%`} stroke="#00F0FF" strokeWidth="6" strokeDasharray="4 4" />
            })}
            <defs>
                <marker id="snake-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#FF3CAC"/></marker>
            </defs>
        </svg>
      </div>

      {/* Controls & Info */}
      <div className="w-full md:w-64 flex flex-col items-center gap-4">
        {status === 'playing' && (
            <>
                <div className="text-center">
                    <p className="text-gray-400">Current Turn</p>
                    <p className={`text-2xl font-bold ${players[currentPlayerIndex].color}`}>Player {players[currentPlayerIndex].id}</p>
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
            </>
        )}

        <div className="text-center text-accent-cyan p-3 bg-black/20 rounded-lg min-h-[60px] w-full">
            {message}
        </div>
        
        {status === 'gameOver' && (
             <div className="flex flex-col items-center gap-4">
                <Award className="text-brand-gold" size={48} />
                <button onClick={resetGame} className="btn-glass bg-accent-green text-black flex items-center gap-2"><RotateCw/> Play Again</button>
             </div>
        )}
      </div>
    </div>
  );
}
