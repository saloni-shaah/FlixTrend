"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, RotateCcw, Users, Wifi, WifiOff } from 'lucide-react';
import { auth, db } from '@/utils/firebaseClient';
import { collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
];

function calculateWinner(squares: ('X' | 'O' | null)[]) {
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return { winner: squares[a], line: lines[i] };
        }
    }
    return null;
}


function Square({ value, onSquareClick, isWinning }: { value: 'X' | 'O' | null, onSquareClick: () => void, isWinning: boolean }) {
  return (
    <button 
        className={`w-20 h-20 md:w-24 md:h-24 bg-black/20 flex items-center justify-center transition-all duration-300 ${isWinning ? 'bg-brand-gold/30' : 'hover:bg-accent-cyan/10'}`}
        onClick={onSquareClick}
    >
        {value === 'X' && <X className={`w-12 h-12 transition-colors ${isWinning ? 'text-white' : 'text-accent-pink'}`} />}
        {value === 'O' && <Circle className={`w-12 h-12 transition-colors ${isWinning ? 'text-white' : 'text-accent-cyan'}`} />}
    </button>
  );
}

function Board({ squares, onPlay, xIsNext, isMyTurn, winningLine }: { squares: ('X' | 'O' | null)[], onPlay: (i:number) => void, xIsNext: boolean, isMyTurn?: boolean, winningLine: number[] | null }) {
    const winnerInfo = calculateWinner(squares);
    const winner = winnerInfo?.winner;
    
    let status;
    if (winner) {
        status = 'Winner: ' + winner;
    } else if (squares.every(Boolean)) {
        status = 'Draw!';
    } else {
        status = `Next player: ${xIsNext ? 'X' : 'O'}`;
    }

    function handleClick(i: number) {
        if (calculateWinner(squares) || squares[i] || (isMyTurn !== undefined && !isMyTurn)) {
            return;
        }
        onPlay(i);
    }
    
    return (
        <div className="flex flex-col items-center gap-4">
             <div className={`font-bold text-xl transition-colors ${winner ? 'text-brand-gold' : 'text-gray-300'}`}>{status}</div>
            <div className="grid grid-cols-3 gap-1 bg-accent-cyan/20 p-1 rounded-lg relative">
                {squares.map((square, i) => (
                    <Square key={i} value={square} onSquareClick={() => handleClick(i)} isWinning={winningLine?.includes(i) || false}/>
                ))}
                 {winningLine && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                        <line 
                            x1={getCoord(winningLine[0]).x} y1={getCoord(winningLine[0]).y}
                            x2={getCoord(winningLine[2]).x} y2={getCoord(winningLine[2]).y}
                            stroke="var(--brand-gold)" 
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}

function getCoord(index: number) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = col * 33.33 + 16.66;
    const y = row * 33.33 + 16.66;
    return { x, y };
}


function OfflineGame() {
    const [history, setHistory] = useState([Array(9).fill(null)]);
    const [currentMove, setCurrentMove] = useState(0);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove];
    const winnerInfo = calculateWinner(currentSquares);

    function handlePlay(nextSquares: ('X' | 'O' | null)[]) {
        const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
    }

    function onSquareClick(i: number) {
        const nextSquares = currentSquares.slice();
        nextSquares[i] = xIsNext ? 'X' : 'O';
        handlePlay(nextSquares);
    }

    const resetGame = () => {
      setHistory([Array(9).fill(null)]);
      setCurrentMove(0);
    }
    
    return (
        <div className="flex flex-col items-center gap-6">
            <Board squares={currentSquares} onPlay={onSquareClick} xIsNext={xIsNext} winningLine={winnerInfo?.line || null}/>
            <button onClick={resetGame} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2">
                <RotateCcw size={16}/> Reset Game
            </button>
             {winnerInfo && (
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-brand-gold animate-bounce">✨ Winner! ✨</h3>
                    <p className="text-gray-300">Congratulations to Player {winnerInfo.winner}!</p>
                </div>
            )}
        </div>
    )
}

function OnlineGame({ gameId, setGameId, user, username }: { gameId: string, setGameId: (id: string | null) => void, user: any, username: string }) {
    const [game, setGame] = useState<any>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "tictactoe", gameId), (doc) => {
            if (doc.exists()) {
                setGame({ id: doc.id, ...doc.data() });
            } else {
                alert("Game not found or has been deleted.");
                setGameId(null);
            }
        });
        return () => unsub();
    }, [gameId, setGameId]);

    const handlePlay = async (i: number) => {
        if (!game || calculateWinner(game.squares)) return;
        
        const playerSymbol = game.players[user.uid].symbol;
        if ((game.xIsNext && playerSymbol !== 'X') || (!game.xIsNext && playerSymbol !== 'O')) {
            return; // Not your turn
        }

        const newSquares = [...game.squares];
        newSquares[i] = playerSymbol;

        await updateDoc(doc(db, "tictactoe", gameId), {
            squares: newSquares,
            xIsNext: !game.xIsNext,
            lastMoveAt: serverTimestamp()
        });
    };

    const handleLeaveGame = async () => {
        if(window.confirm("Are you sure you want to leave this game?")) {
            setGameId(null);
        }
    }

    if (!game) return <div className="text-accent-cyan animate-pulse">Loading game...</div>;

    const winnerInfo = calculateWinner(game.squares);
    const mySymbol = game.players[user.uid]?.symbol;
    const isMyTurn = (game.xIsNext && mySymbol === 'X') || (!game.xIsNext && mySymbol === 'O');

    return (
        <div className="flex flex-col items-center gap-6">
            <Board squares={game.squares} onPlay={handlePlay} xIsNext={game.xIsNext} isMyTurn={isMyTurn} winningLine={winnerInfo?.line || null}/>
            <button onClick={handleLeaveGame} className="btn-glass bg-red-500/20 text-red-400 flex items-center gap-2">
                Leave Game
            </button>
             {winnerInfo && (
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-brand-gold animate-bounce">✨ Winner! ✨</h3>
                    <p className="text-gray-300">Congratulations to Player {winnerInfo.winner}!</p>
                </div>
            )}
             {!winnerInfo && <p className="text-sm text-gray-400">{isMyTurn ? "Your turn!" : "Waiting for opponent..."}</p>}
        </div>
    );
}

function Lobby({ setGameId, setMode, user, username }: { setGameId: (id: string) => void, setMode: (mode: 'online' | 'offline') => void, user: any, username: string }) {
    const [openGames, setOpenGames] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "tictactoe"), where("status", "==", "waiting"), limit(10));
        const unsub = onSnapshot(q, (snapshot) => {
            setOpenGames(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleCreateGame = async () => {
        const newGame = {
            players: { [user.uid]: { symbol: 'X', name: username } },
            squares: Array(9).fill(null),
            xIsNext: true,
            status: 'waiting', // waiting, playing, finished
            createdAt: serverTimestamp(),
            host: username
        };
        const docRef = await addDoc(collection(db, "tictactoe"), newGame);
        setGameId(docRef.id);
        setMode('online');
    };

    const handleJoinGame = async (gameId: string) => {
         await updateDoc(doc(db, "tictactoe", gameId), {
            [`players.${user.uid}`]: { symbol: 'O', name: username },
            status: 'playing'
        });
        setGameId(gameId);
        setMode('online');
    };

    return (
        <div className="w-full">
            <button onClick={handleCreateGame} className="w-full btn-glass bg-accent-pink mb-6">Create New Online Game</button>
            
            <h3 className="font-bold text-accent-cyan mb-4">Join an Existing Game</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {openGames.length > 0 ? openGames.map(game => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <span>Game hosted by {game.host}</span>
                        <button onClick={() => handleJoinGame(game.id)} className="btn-glass text-xs bg-accent-cyan text-black">Join</button>
                    </div>
                )) : <p className="text-sm text-gray-400 text-center">No open games. Create one!</p>}
            </div>
        </div>
    );
}


export function TicTacToe() {
    const [mode, setMode] = useState<'menu' | 'offline' | 'online'>('menu');
    const [gameId, setGameId] = useState<string | null>(null);
    const [user, loading] = useAuthState(auth);
    const [username, setUsername] = useState('Player');

    useEffect(() => {
        if (user) {
            const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
                if(doc.exists()) {
                    setUsername(doc.data().username || `Player${user.uid.slice(0, 4)}`);
                }
            });
            return () => unsub();
        }
    }, [user]);

    const handleModeSelect = (selectedMode: 'offline' | 'online') => {
        if (selectedMode === 'online' && !user) {
            alert("You must be logged in to play online.");
            return;
        }
        setMode(selectedMode);
    }
    
    const resetToMenu = () => {
        setMode('menu');
        setGameId(null);
    }

    const renderContent = () => {
        if (loading) return <div className="animate-pulse text-accent-cyan">Authenticating...</div>
        
        if (gameId && mode === 'online' && user) {
            return <OnlineGame gameId={gameId} setGameId={setGameId} user={user} username={username}/>
        }

        switch (mode) {
            case 'offline':
                return <OfflineGame />;
            case 'online':
                return <Lobby setGameId={setGameId} setMode={setMode} user={user} username={username} />;
            case 'menu':
            default:
                return (
                     <div className="flex flex-col gap-4">
                        <button onClick={() => handleModeSelect('online')} className="btn-glass flex items-center gap-3"><Wifi/>Play Online</button>
                        <button onClick={() => handleModeSelect('offline')} className="btn-glass flex items-center gap-3"><WifiOff/>Play Offline (2 Players)</button>
                    </div>
                );
        }
    }

    return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-card p-8 flex flex-col items-center gap-6"
        >
            <h2 className="text-3xl font-headline text-accent-pink">Tic-Tac-Toe</h2>
            {mode !== 'menu' && (
                <button onClick={resetToMenu} className="text-xs text-accent-cyan hover:underline self-start">{"< Back to Menu"}</button>
            )}
            {renderContent()}
        </motion.div>
    )
}
