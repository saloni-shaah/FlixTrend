"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FlixTrendLogo } from '../FlixTrendLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Rabbit, Turtle, ChevronsRight } from 'lucide-react';

type GameStatus = 'waiting' | 'playing' | 'gameOver';
type GameMode = 'easy' | 'normal' | 'hard';

const gameSpeeds = {
  easy: 6,
  normal: 8,
  hard: 11,
};

export function OfflineDinoRun() {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [mode, setMode] = useState<GameMode>('normal');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const playerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const obstaclesRef = useRef<HTMLDivElement[]>([]);
  const frameId = useRef<number | null>(null);
  const scoreInterval = useRef<NodeJS.Timeout | null>(null);
  const isJumping = useRef(false);
  const yVelocity = useRef(0);
  const gravity = 0.8;

  useEffect(() => {
    const storedHighScore = localStorage.getItem('dinoRunHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setStatus('playing');
    setScore(0);
    obstaclesRef.current = [];
    isJumping.current = false;
    yVelocity.current = 0;

    // Clear any existing obstacles from previous games
    if (gameAreaRef.current) {
        const existingObstacles = gameAreaRef.current.querySelectorAll('.obstacle');
        existingObstacles.forEach(obs => obs.remove());
    }


    scoreInterval.current = setInterval(() => {
      setScore(s => s + 1);
    }, 100);

    gameLoop();
  };

  const gameOver = useCallback(() => {
    setStatus('gameOver');
    if (frameId.current) cancelAnimationFrame(frameId.current);
    if (scoreInterval.current) clearInterval(scoreInterval.current);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('dinoRunHighScore', score.toString());
    }
  }, [score, highScore]);

  const gameLoop = useCallback(() => {
    if (gameAreaRef.current) {
      const gameArea = gameAreaRef.current;
      const speed = gameSpeeds[mode];

      // Spawn new obstacles
      if (Math.random() < 0.02) {
        const newObstacle = document.createElement('div');
        newObstacle.className = 'obstacle absolute bottom-0 bg-accent-pink';
        const isTall = Math.random() > 0.5;
        newObstacle.style.width = '20px';
        newObstacle.style.height = isTall ? '50px' : '30px';
        newObstacle.style.right = '-20px';
        gameArea.appendChild(newObstacle);
        obstaclesRef.current.push(newObstacle);
      }

      // Move obstacles and check for collision
      obstaclesRef.current.forEach((obs, index) => {
        const currentRight = parseFloat(obs.style.right || '0');
        obs.style.right = `${currentRight + speed}px`;

        // Cleanup off-screen obstacles
        if (currentRight > gameArea.offsetWidth) {
          obs.remove();
          obstaclesRef.current.splice(index, 1);
        }

        // Collision detection
        if (playerRef.current) {
          const playerRect = playerRef.current.getBoundingClientRect();
          const obsRect = obs.getBoundingClientRect();
          if (
            playerRect.right > obsRect.left &&
            playerRect.left < obsRect.right &&
            playerRect.bottom > obsRect.top
          ) {
            gameOver();
          }
        }
      });

      // Player jump physics
      if (playerRef.current) {
          const player = playerRef.current;
          let bottom = parseFloat(player.style.bottom || '0');

          if(isJumping.current) {
              bottom += yVelocity.current;
              yVelocity.current -= gravity;
              player.style.bottom = `${bottom}px`;
              if (bottom <= 0) {
                  player.style.bottom = '0px';
                  isJumping.current = false;
              }
          }
      }
    }
    frameId.current = requestAnimationFrame(gameLoop);
  }, [mode, gameOver]);

  const jump = useCallback(() => {
    if (status === 'playing' && !isJumping.current) {
      isJumping.current = true;
      yVelocity.current = 18;
    }
  }, [status]);
  
  useEffect(() => {
      const handleKeyPress = (e: KeyboardEvent) => {
          if (e.code === 'Space' || e.key === ' ') {
              if (status === 'playing') jump();
              if (status === 'waiting' || status === 'gameOver') startGame(mode);
          }
      };
      
      const handleTouch = () => {
          if (status === 'playing') jump();
          if (status === 'waiting' || status === 'gameOver') startGame(mode);
      };

      window.addEventListener('keydown', handleKeyPress);
      gameAreaRef.current?.addEventListener('touchstart', handleTouch);
      
      return () => {
          window.removeEventListener('keydown', handleKeyPress);
          gameAreaRef.current?.removeEventListener('touchstart', handleTouch);
          if (frameId.current) cancelAnimationFrame(frameId.current);
          if (scoreInterval.current) clearInterval(scoreInterval.current);
      };
  }, [status, jump, mode, startGame]);

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4 font-body relative overflow-hidden" tabIndex={0} ref={gameAreaRef}>
      
      <div className="absolute top-4 left-4 text-left">
          <p className="font-bold">Score: <span className="text-accent-cyan">{score}</span></p>
          <p className="text-sm">High Score: <span className="text-brand-gold">{highScore}</span></p>
      </div>

      <AnimatePresence>
        {status !== 'playing' && (
             <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center text-center p-4"
             >
                {status === 'waiting' ? (
                    <>
                        <h2 className="text-4xl font-headline font-bold text-accent-cyan">Offline Dino Run</h2>
                        <p className="text-gray-400 mt-2 mb-6">Jump over obstacles with the FlixTrend logo!</p>
                        <div className="flex flex-col md:flex-row gap-4">
                            <button onClick={() => startGame('easy')} className="btn-glass flex items-center gap-2 hover:border-green-400"><Turtle size={16}/> Easy</button>
                            <button onClick={() => startGame('normal')} className="btn-glass flex items-center gap-2 hover:border-yellow-400"><Rabbit size={16}/> Normal</button>
                            <button onClick={() => startGame('hard')} className="btn-glass flex items-center gap-2 hover:border-red-400"><ChevronsRight size={16}/> Hard</button>
                        </div>
                        <p className="text-sm text-gray-500 mt-8">Press Space or Tap to Jump/Start</p>
                    </>
                ) : ( // gameOver
                     <>
                        <h2 className="text-4xl font-headline font-bold text-accent-pink">Game Over</h2>
                        <div className="my-4 text-lg">
                            <p>Your Score: <span className="text-accent-cyan font-bold">{score}</span></p>
                            <p className="flex items-center gap-2 justify-center">High Score: <span className="text-brand-gold font-bold">{highScore}</span> {score === highScore && score > 0 && <Award className="text-brand-gold"/>}</p>
                        </div>
                        <button onClick={() => startGame(mode)} className="btn-glass bg-accent-pink text-white">
                            Play Again
                        </button>
                         <button onClick={() => setStatus('waiting')} className="text-sm text-gray-400 mt-4 hover:underline">
                            Change Mode
                        </button>
                    </>
                )}
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Game Floor */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-cyan/50" />

      {/* Player */}
      <div ref={playerRef} className="absolute bottom-0 left-8 w-12 h-12">
        <FlixTrendLogo size={48}/>
      </div>

    </div>
  );
}
