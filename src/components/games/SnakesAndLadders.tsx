"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { OnlineMatchPanel, useOnlineMatch } from "./OnlineMatch";

const JUMPS: Record<number, number> = {
  3: 22, 5: 8, 11: 26, 20: 29, 27: 1, 21: 9, 17: 4, 19: 7,
  54: 34, 62: 18, 64: 60, 71: 91, 87: 24, 95: 75, 99: 78, 80: 100,
};
const LADDERS = new Set([3, 5, 11, 20, 71, 80]);
const COLORS = ["bg-rose-500", "bg-cyan-400", "bg-amber-300", "bg-violet-400"];
const PLAYERS = ["Player 1", "Player 2"];
type LadderState = { positions: [number, number]; turn: number; die: number | null; message: string };
const INITIAL_STATE: LadderState = {
  positions: [0, 0], turn: 0, die: null, message: "Roll the die to begin. First to reach 100 wins!",
};

function boardNumber(row: number, col: number) {
  const fromBottom = 9 - row;
  return fromBottom * 10 + (fromBottom % 2 === 0 ? col + 1 : 10 - col);
}

export function SnakesAndLadders() {
  const [mode, setMode] = useState<"local" | "online">("local");
  const [localGame, setLocalGame] = useState<LadderState>(INITIAL_STATE);
  const online = useOnlineMatch<LadderState>("snakes-and-ladders", INITIAL_STATE);
  const room = mode === "online" ? online.room : null;
  const game = room?.state ?? localGame;
  const { positions, turn, die, message } = game;
  const players = room ? [room.host.name, room.guest?.name || "Opponent"] : PLAYERS;
  const winner = positions.findIndex(position => position === 100);

  const resetGame = () => {
    if (mode === "online") online.leaveRoom();
    setLocalGame(INITIAL_STATE);
  };

  const rollDie = async () => {
    if (winner !== -1 || (mode === "online" && (!room || room.status !== "active" || room.turnUid !== online.user?.uid))) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    const current = positions[turn];
    const landed = current + roll;
    const nextPositions: [number, number] = [...positions];
    let nextTurn = landed > 100 ? 1 - turn : roll === 6 ? turn : 1 - turn;
    let nextMessage: string;
    let winningPlayer: number | null = null;
    if (landed > 100) {
      nextMessage = `${players[turn]} rolled ${roll} — an exact roll is needed to reach 100.`;
    } else {
      const destination = JUMPS[landed] ?? landed;
      nextPositions[turn] = destination;
      if (destination === 100) {
        nextMessage = `${players[turn]} wins!`;
        winningPlayer = turn;
      } else if (destination !== landed) {
        nextMessage = `${players[turn]} rolled ${roll} and ${LADDERS.has(landed) ? "climbed a ladder" : "slid down a snake"} to ${destination}.`;
      } else {
        nextMessage = `${players[turn]} rolled ${roll}. ${roll === 6 ? "Roll again!" : `${players[1 - turn]}'s turn.`}`;
      }
    }
    const next: LadderState = { positions: nextPositions, turn: nextTurn, die: roll, message: nextMessage };
    if (room) {
      const currentUid = turn === 0 ? room.host.uid : room.guest?.uid;
      const opponentUid = turn === 0 ? room.guest?.uid : room.host.uid;
      if (!currentUid || !opponentUid) return;
      if (winningPlayer !== null) nextTurn = turn;
      await online.play(next, nextTurn === turn ? currentUid : opponentUid,
        winningPlayer !== null ? currentUid : null, winningPlayer !== null);
    } else {
      setLocalGame(next);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-accent-pink sm:text-3xl">Snakes &amp; Ladders</h2>
          <p className="mt-1 text-sm text-gray-400">Race a friend to square 100, locally or online</p>
        </div>
        <button onClick={resetGame} className="btn-glass flex items-center gap-2">
          <RotateCcw size={16} /> New game
        </button>
      </header>

      <div className="flex w-fit rounded-full border border-white/10 bg-black/25 p-1">
        {(["local", "online"] as const).map(option => (
          <button key={option} onClick={() => setMode(option)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${mode === option ? "bg-accent-pink text-white" : "text-gray-400 hover:text-white"}`}>
            {option === "local" ? "Pass & play" : "Online"}
          </button>
        ))}
      </div>
      {mode === "online" && <OnlineMatchPanel room={online.room} userId={online.user?.uid} busy={online.busy}
        error={online.error} createRoom={async () => { await online.createRoom(); }}
        joinRoom={online.joinRoom} leaveRoom={online.leaveRoom} resign={online.resign} />}

      <div className="flex flex-col items-center gap-4">
        <div aria-live="polite" className="w-full max-w-xl rounded-xl border border-accent-cyan/20 bg-accent-cyan/[0.06] px-4 py-3 text-center text-sm font-semibold text-gray-100">
          {winner === -1 && room?.status !== "finished" && <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${COLORS[turn]}`} />}
          {room?.status === "waiting" ? "Waiting for an opponent to join your room…" : room?.status === "finished" && winner === -1 ? "The match has ended." : message}
        </div>

        <div className="grid w-full max-w-xl grid-cols-10 overflow-hidden rounded-xl border-2 border-white/15 shadow-2xl">
          {Array.from({ length: 100 }, (_, index) => {
            const row = Math.floor(index / 10);
            const col = index % 10;
            const number = boardNumber(row, col);
            const destination = JUMPS[number];
            const isLadder = LADDERS.has(number);
            const piecesHere = positions.flatMap((position, player) => position === number ? [player] : []);
            return (
              <div
                key={number}
                className={`relative flex aspect-square min-w-0 flex-col items-center justify-center border-[0.5px] border-black/10 ${
                  (row + col) % 2 === 0 ? "bg-[#e7f1e8] text-slate-800" : "bg-[#c8dfd2] text-slate-800"
                }`}
              >
                <span className="absolute left-1 top-0.5 text-[clamp(7px,1.5vw,10px)] font-semibold opacity-70">{number}</span>
                {destination && (
                  <span className={`text-[clamp(12px,3vw,21px)] leading-none ${isLadder ? "text-emerald-700" : "text-rose-600"}`} aria-label={isLadder ? `Ladder to ${destination}` : `Snake to ${destination}`}>
                    {isLadder ? "↗" : "↘"}
                  </span>
                )}
                {piecesHere.length > 0 && (
                  <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                    {piecesHere.map(player => (
                      <span key={player} aria-label={`${PLAYERS[player]} token`} className={`h-[clamp(6px,1.6vw,11px)] w-[clamp(6px,1.6vw,11px)] rounded-full border border-white shadow ${COLORS[player]}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-300">
          {PLAYERS.map((player, index) => (
            <div key={player} className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${winner === -1 && turn === index ? "bg-white/10" : ""}`}>
              <span className={`h-3 w-3 rounded-full ${COLORS[index]}`} />
              <span>{players[index]}: {positions[index] === 0 ? "Start" : positions[index]}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void rollDie()}
            disabled={winner !== -1 || (mode === "online" && (!room || room.status !== "active" || room.turnUid !== online.user?.uid))}
            className="btn-glass min-w-32 bg-accent-purple/20 font-bold text-accent-cyan disabled:cursor-not-allowed disabled:opacity-50"
          >
            {winner !== -1 || room?.status === "finished" ? "Game over" : `${players[turn]} · Roll`}
          </button>
          <div aria-label={die ? `Last roll: ${die}` : "No roll yet"} className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-2xl font-bold text-white">
            {die ?? "—"}
          </div>
        </div>
        <p className="text-center text-xs text-gray-500">Roll a 6 for another turn. Exact roll required to finish.</p>
      </div>
    </motion.section>
  );
}
