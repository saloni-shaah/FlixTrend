"use client";

import { useState } from "react";
import { Circle, RotateCcw, X } from "lucide-react";
import { OnlineMatchPanel, useOnlineMatch } from "./OnlineMatch";

type Mark = "X" | "O" | null;
type TicTacToeState = { squares: Mark[] };
const EMPTY_STATE: TicTacToeState = { squares: Array<Mark>(9).fill(null) };
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winnerOf(squares: Mark[]) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { mark: squares[a] as Exclude<Mark, null>, line };
    }
  }
  return null;
}

export function TicTacToe() {
  const [mode, setMode] = useState<"local" | "online">("local");
  const [localSquares, setLocalSquares] = useState<Mark[]>(EMPTY_STATE.squares);
  const [localMark, setLocalMark] = useState<"X" | "O">("X");
  const online = useOnlineMatch<TicTacToeState>("tic-tac-toe", EMPTY_STATE);
  const room = mode === "online" ? online.room : null;
  const squares = room?.state.squares ?? localSquares;
  const winner = winnerOf(squares);
  const draw = !winner && squares.every(Boolean);
  const localTurn = !room || room.turnUid === online.user?.uid;
  const currentMark = room
    ? room.turnUid === room.host.uid ? "X" : "O"
    : localMark;
  const gameOver = Boolean(winner || draw || room?.status === "finished");

  const playSquare = async (index: number) => {
    if (gameOver || squares[index] || !localTurn) return;
    const next = squares.slice();
    next[index] = currentMark;
    if (room) {
      const matchWinner = winnerOf(next);
      const isDraw = !matchWinner && next.every(Boolean);
      const opponentUid = online.user?.uid === room.host.uid ? room.guest?.uid : room.host.uid;
      if (!opponentUid) return;
      await online.play(
        { squares: next },
        opponentUid,
        matchWinner ? online.user?.uid ?? null : null,
        Boolean(matchWinner || isDraw),
      );
    } else {
      setLocalSquares(next);
      if (!winnerOf(next) && !next.every(Boolean)) setLocalMark(mark => mark === "X" ? "O" : "X");
    }
  };

  const resetLocalGame = () => {
    setLocalSquares(Array<Mark>(9).fill(null));
    setLocalMark("X");
  };

  const status = room?.status === "waiting" ? "Waiting for an opponent to join your room…"
    : room?.status === "finished" ? room.winnerUid
      ? `${room.winnerUid === room.host.uid ? room.host.name : room.guest?.name} wins!`
      : "It's a draw!"
    : winner ? `${winner.mark} wins!`
    : draw ? "It's a draw!"
    : room ? room.turnUid === online.user?.uid ? "Your turn" : `${room.turnUid === room.host.uid ? room.host.name : room.guest?.name}'s turn`
    : `Player ${localMark}'s turn`;

  return (
    <section className="glass-card mx-auto flex w-full max-w-xl flex-col items-center gap-5 p-4 sm:p-7">
      <header className="w-full text-center">
        <h2 className="text-3xl font-headline font-bold text-accent-pink">Tic-Tac-Toe</h2>
        <p className="mt-1 text-sm text-gray-400">Quick rematches, now with real-time online duels.</p>
      </header>

      <div className="flex rounded-full border border-white/10 bg-black/25 p-1">
        {(["local", "online"] as const).map(option => (
          <button key={option} onClick={() => setMode(option)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-colors ${mode === option ? "bg-accent-pink text-white" : "text-gray-400 hover:text-white"}`}>
            {option === "local" ? "Pass & play" : "Online"}
          </button>
        ))}
      </div>

      {mode === "online" && <OnlineMatchPanel room={online.room} userId={online.user?.uid} busy={online.busy}
        error={online.error} createRoom={async () => { await online.createRoom(); }}
        joinRoom={online.joinRoom} leaveRoom={online.leaveRoom} resign={online.resign} />}

      <p aria-live="polite" className={`text-center text-lg font-bold ${winner ? "text-amber-300" : "text-gray-200"}`}>
        {mode === "online" && !room ? "Create a room or join a friend" : status}
      </p>
      <div className={`grid grid-cols-3 gap-2 rounded-xl border border-accent-cyan/20 bg-accent-cyan/10 p-2 ${mode === "online" && (!room || room.status !== "active") ? "opacity-40" : ""}`}>
        {squares.map((mark, index) => {
          const winning = winner?.line.includes(index) ?? false;
          return (
            <button key={index} type="button" aria-label={`Square ${index + 1}${mark ? `, ${mark}` : ""}`}
              disabled={mode === "online" && (!room || room.status !== "active")}
              onClick={() => void playSquare(index)}
              className={`grid h-[clamp(4rem,18vw,7rem)] w-[clamp(4rem,18vw,7rem)] place-items-center rounded-lg bg-black/25 transition-colors hover:bg-accent-cyan/10 disabled:cursor-not-allowed ${winning ? "bg-amber-300/20" : ""}`}>
              {mark === "X" && <X className={`h-10 w-10 sm:h-14 sm:w-14 ${winning ? "text-amber-200" : "text-accent-pink"}`} />}
              {mark === "O" && <Circle className={`h-10 w-10 sm:h-14 sm:w-14 ${winning ? "text-amber-200" : "text-accent-cyan"}`} />}
            </button>
          );
        })}
      </div>

      {mode === "local" && <button onClick={resetLocalGame} className="btn-glass flex items-center gap-2">
        <RotateCcw size={16} /> New game
      </button>}
      {mode === "online" && room?.status === "finished" && <button onClick={online.leaveRoom} className="btn-glass flex items-center gap-2">
        <RotateCcw size={16} /> Play again
      </button>}
    </section>
  );
}
