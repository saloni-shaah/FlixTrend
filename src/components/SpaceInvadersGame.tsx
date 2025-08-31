"use client";
import React, { useEffect, useRef, useState } from 'react';

// A simple implementation of Space Invaders

export function SpaceInvadersGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const gameLoopRef = useRef<number>();

    // Game state refs to be accessible within game loop
    const playerRef = useRef({ x: 0, y: 0, width: 50, height: 20 });
    const bulletsRef = useRef<any[]>([]);
    const invadersRef = useRef<any[]>([]);
    const keysRef = useRef<{ [key: string]: boolean }>({});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        const W = canvas.width;
        const H = canvas.height;

        const init = () => {
            setScore(0);
            setGameOver(false);

            // Player
            playerRef.current = { x: W / 2 - 25, y: H - 40, width: 50, height: 20 };
            
            // Bullets
            bulletsRef.current = [];

            // Invaders
            invadersRef.current = [];
            let invaderY = 30;
            for (let row = 0; row < 3; row++) {
                let invaderX = 50;
                for (let col = 0; col < 8; col++) {
                    invadersRef.current.push({ x: invaderX, y: invaderY, width: 40, height: 20, alive: true });
                    invaderX += 50;
                }
                invaderY += 30;
            }
        };

        const draw = () => {
            context.clearRect(0, 0, W, H);
            
            // Draw player
            context.fillStyle = 'cyan';
            context.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);

            // Draw bullets
            context.fillStyle = 'red';
            bulletsRef.current.forEach(bullet => {
                context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            });

            // Draw invaders
            context.fillStyle = 'lime';
            invadersRef.current.forEach(invader => {
                if(invader.alive) context.fillRect(invader.x, invader.y, invader.width, invader.height);
            });
        };

        const update = () => {
            // Player movement
            if (keysRef.current['ArrowLeft'] && playerRef.current.x > 0) playerRef.current.x -= 5;
            if (keysRef.current['ArrowRight'] && playerRef.current.x < W - playerRef.current.width) playerRef.current.x += 5;

            // Update bullets
            bulletsRef.current.forEach((bullet, bIndex) => {
                bullet.y -= 7;
                if (bullet.y < 0) bulletsRef.current.splice(bIndex, 1);

                // Collision detection
                invadersRef.current.forEach((invader) => {
                    if (invader.alive && bullet.x < invader.x + invader.width && bullet.x + bullet.width > invader.x &&
                        bullet.y < invader.y + invader.height && bullet.y + bullet.height > invader.y) {
                        invader.alive = false;
                        bulletsRef.current.splice(bIndex, 1);
                        setScore(s => s + 10);
                    }
                });
            });
            
            // Check for game over
            if (invadersRef.current.every(invader => !invader.alive)) {
                setGameOver(true);
            }
        };

        const gameLoop = () => {
            if (gameOver) {
                context.fillStyle = 'white';
                context.font = '40px Arial';
                context.fillText('YOU WIN!', W / 2 - 100, H / 2);
                cancelAnimationFrame(gameLoopRef.current!);
                return;
            }
            update();
            draw();
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };
        
        const handleKeyDown = (e: KeyboardEvent) => {
            keysRef.current[e.key] = true;
            if (e.key === ' ' && gameStarted) {
                bulletsRef.current.push({ x: playerRef.current.x + playerRef.current.width / 2 - 2.5, y: playerRef.current.y, width: 5, height: 10 });
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        if (gameStarted) {
            init();
            gameLoop();
        } else {
            context.clearRect(0, 0, W, H);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(gameLoopRef.current!);
        };
    }, [gameStarted, gameOver]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl">
            {!gameStarted ? (
                <div className="text-center">
                    <h3 className="text-2xl font-bold mb-4">Space Invaders</h3>
                    <p className="mb-4">Use Left/Right arrow keys to move. Spacebar to shoot.</p>
                    <button className="btn-glass bg-accent-pink" onClick={() => setGameStarted(true)}>Start Game</button>
                </div>
            ) : (
                <>
                    <div className="text-xl font-bold mb-2">Score: {score}</div>
                    <canvas ref={canvasRef} width="600" height="400" className="bg-black rounded-lg border border-accent-cyan" />
                    {gameOver && <button className="btn-glass mt-4" onClick={() => setGameStarted(false)}>Play Again</button>}
                </>
            )}
        </div>
    );
}
