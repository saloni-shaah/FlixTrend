"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { ScoreLeaderboard } from "./ScoreLeaderboard";

type Suit = "♠" | "♥" | "♦" | "♣";
type Card = { id: string; suit: Suit; rank: number; faceUp: boolean };
type Source = { area: "waste" | "tableau" | "foundation"; index?: number };
type Selection = Source & { cardIndex?: number };
type Position = { stock: Card[]; waste: Card[]; tableau: Card[][]; foundations: Card[][]; moves: number; score: number };
type Game = Position & { history: Position[]; won: boolean };

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const isRed = (suit: Suit) => suit === "♥" || suit === "♦";
const copyPosition = (game: Position): Position => ({
  stock: game.stock.map(card => ({ ...card })),
  waste: game.waste.map(card => ({ ...card })),
  tableau: game.tableau.map(pile => pile.map(card => ({ ...card }))),
  foundations: game.foundations.map(pile => pile.map(card => ({ ...card }))),
  moves: game.moves, score: game.score,
});

function deal(): Game {
  const deck = SUITS.flatMap(suit => Array.from({ length: 13 }, (_, i) => ({
    id: `${suit}-${i + 1}`, suit, rank: i + 1, faceUp: false,
  } as Card)));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  let index = 0;
  const tableau = Array.from({ length: 7 }, (_, pile) =>
    Array.from({ length: pile + 1 }, (_, cardIndex) => ({ ...deck[index++], faceUp: cardIndex === pile })));
  return { stock: deck.slice(index), waste: [], tableau, foundations: [[], [], [], []], moves: 0, score: 0, history: [], won: false };
}

function validTableauMove(card: Card, destination: Card | undefined) {
  return destination ? isRed(card.suit) !== isRed(destination.suit) && card.rank === destination.rank - 1 : card.rank === 13;
}

function validFoundationMove(card: Card, destination: Card | undefined) {
  return destination ? card.suit === destination.suit && card.rank === destination.rank + 1 : card.rank === 1;
}

function CardFace({ card, selected = false }: { card: Card; selected?: boolean }) {
  if (!card.faceUp) {
    return <div className={`flex aspect-[5/7] w-full items-center justify-center rounded-lg border border-white/30 bg-gradient-to-br from-indigo-500 to-violet-900 p-1 shadow-md ${selected ? "ring-2 ring-accent-cyan" : ""}`}>
      <div className="grid h-full w-full place-items-center rounded-md border border-white/25 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.08)_0,rgba(255,255,255,.08)_2px,transparent_2px,transparent_6px)] text-sm text-white/80">✦</div>
    </div>;
  }
  return <div className={`relative flex aspect-[5/7] w-full flex-col rounded-lg border bg-[#fffdf7] p-1 text-left shadow-md sm:p-1.5 ${selected ? "border-accent-cyan ring-2 ring-accent-cyan" : "border-slate-300"}`}>
    <span className={`text-[clamp(9px,2vw,14px)] font-black leading-none ${isRed(card.suit) ? "text-rose-600" : "text-slate-900"}`}>{RANKS[card.rank]}<br />{card.suit}</span>
    <span className={`absolute inset-0 grid place-items-center text-[clamp(17px,4vw,30px)] ${isRed(card.suit) ? "text-rose-600" : "text-slate-900"}`}>{card.suit}</span>
  </div>;
}

export function Solitaire() {
  const [game, setGame] = useState<Game>(() => deal());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    try {
      setBestScore(Number(localStorage.getItem("solitaireBestScore") || 0));
    } catch (error) {
      console.error("Could not load your Solitaire best score.", error);
    }
  }, []);

  useEffect(() => {
    if (game.won) return;
    const interval = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [game.won]);

  useEffect(() => {
    if (!game.won || game.score <= bestScore) return;
    setBestScore(game.score);
    try {
      localStorage.setItem("solitaireBestScore", String(game.score));
    } catch (error) {
      console.error("Could not save your Solitaire best score.", error);
    }
  }, [bestScore, game.score, game.won]);

  const restart = () => { setGame(deal()); setSelection(null); setSeconds(0); };
  const update = (change: (position: Position) => Position) => {
    setGame(current => {
      if (current.won) return current;
      const position = change(copyPosition(current));
      const won = position.foundations.every(pile => pile.length === 13);
      return { ...position, won, history: [...current.history, copyPosition(current)] };
    });
    setSelection(null);
  };

  const draw = () => {
    if (game.stock.length) {
      update(position => {
        const card = position.stock.pop()!;
        position.waste.push({ ...card, faceUp: true });
        position.moves++;
        return position;
      });
    } else if (game.waste.length) {
      update(position => {
        position.stock = position.waste.reverse().map(card => ({ ...card, faceUp: false }));
        position.waste = [];
        position.moves++;
        return position;
      });
    }
  };

  const selectedCards = (): Card[] => {
    if (!selection) return [];
    if (selection.area === "waste") return game.waste.length ? [game.waste[game.waste.length - 1]] : [];
    if (selection.area === "foundation") {
      const pile = game.foundations[selection.index ?? 0];
      return pile.length ? [pile[pile.length - 1]] : [];
    }
    return game.tableau[selection.index ?? 0].slice(selection.cardIndex ?? 0);
  };

  const moveToTableau = (target: number) => {
    if (!selection) return;
    if (selection.area === "tableau" && selection.index === target) return;
    const cards = selectedCards();
    const sourcePile = game.tableau[target];
    if (!cards.length || !validTableauMove(cards[0], sourcePile.at(-1))) return;
    update(position => {
      let moving: Card[];
      if (selection.area === "waste") moving = [position.waste.pop()!];
      else if (selection.area === "foundation") moving = [position.foundations[selection.index ?? 0].pop()!];
      else {
        moving = position.tableau[selection.index ?? 0].splice(selection.cardIndex ?? 0);
        const exposed = position.tableau[selection.index ?? 0].at(-1);
        if (exposed && !exposed.faceUp) position.score += 5;
        if (exposed) exposed.faceUp = true;
      }
      position.tableau[target].push(...moving);
      position.moves++;
      return position;
    });
  };

  const moveToFoundation = (target: number) => {
    if (!selection || selection.area === "foundation") return;
    const cards = selectedCards();
    if (cards.length !== 1 || !validFoundationMove(cards[0], game.foundations[target].at(-1))) return;
    update(position => {
      const card = selection.area === "waste"
        ? position.waste.pop()!
        : position.tableau[selection.index ?? 0].pop()!;
      if (selection.area === "tableau") {
        const exposed = position.tableau[selection.index ?? 0].at(-1);
        if (exposed) exposed.faceUp = true;
      }
      position.foundations[target].push(card);
      position.score += 10;
      position.moves++;
      return position;
    });
  };

  const selectFoundation = (index: number) => {
    const pile = game.foundations[index];
    if (!pile.length) return moveToFoundation(index);
    if (selection) return moveToFoundation(index);
    setSelection({ area: "foundation", index });
  };

  const selectTableau = (column: number, cardIndex: number) => {
    if (selection) {
      if (selection.area !== "tableau" || selection.index !== column) {
        moveToTableau(column);
        return;
      }
      if (selection.cardIndex === cardIndex) { setSelection(null); return; }
    }
    setSelection({ area: "tableau", index: column, cardIndex });
  };

  const selectWaste = () => {
    if (!game.waste.length) return;
    setSelection({ area: "waste" });
  };

  const undo = () => {
    if (!game.history.length) return;
    const previous = game.history[game.history.length - 1];
    setGame({ ...copyPosition(previous), history: game.history.slice(0, -1), won: false });
    setSelection(null);
  };

  const wasteCard = game.waste.at(-1);

  return (
    <section className="glass-card mx-auto flex w-full max-w-5xl flex-col gap-4 p-3 sm:gap-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-accent-green sm:text-3xl">Klondike Solitaire</h2>
          <p className="mt-1 text-sm text-gray-400">Classic draw-one Solitaire · completely offline</p>
        </div>
        <div className="flex gap-2">
          <button onClick={undo} disabled={!game.history.length} className="btn-glass flex items-center gap-2 disabled:opacity-40"><Undo2 size={16} /> Undo</button>
          <button onClick={restart} className="btn-glass flex items-center gap-2"><RotateCcw size={16} /> New game</button>
        </div>
      </header>

      <div className="flex items-center justify-between text-xs font-semibold text-gray-400 sm:text-sm">
        <span>Moves <b className="ml-1 text-gray-100">{game.moves}</b></span>
        <span>Score <b className="ml-1 text-amber-200">{game.score}</b> <span className="text-gray-500">· best {bestScore}</span></span>
        <span>Time <b className="ml-1 text-gray-100">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</b></span>
      </div>

      <div className="rounded-2xl border border-emerald-300/15 bg-[radial-gradient(ellipse_at_top,_rgba(25,130,85,.25),_rgba(7,48,39,.38)_55%,_rgba(4,29,26,.7))] p-2 shadow-inner sm:p-4">
        <div className="mb-5 grid grid-cols-7 gap-1.5 sm:mb-7 sm:gap-3">
          <button onClick={draw} aria-label={game.stock.length ? `Draw from stock, ${game.stock.length} cards remaining` : "Recycle waste into stock"} className="min-w-0 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan">
            {game.stock.length ? <CardFace card={game.stock[game.stock.length - 1]} /> : <div className="grid aspect-[5/7] place-items-center rounded-lg border border-dashed border-white/25 text-2xl text-white/70">↻</div>}
            <span className="mt-1 block text-center text-[10px] text-gray-400">{game.stock.length || "Stock"}</span>
          </button>
          <button onClick={selectWaste} aria-label={wasteCard ? `Waste ${RANKS[wasteCard.rank]} of ${wasteCard.suit}` : "Empty waste pile"} className="min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan">
            {wasteCard ? <CardFace card={wasteCard} selected={selection?.area === "waste"} /> : <div className="aspect-[5/7] rounded-lg border border-dashed border-white/20" />}
            <span className="mt-1 block text-center text-[10px] text-gray-400">Waste</span>
          </button>
          <div className="col-span-1" />
          {game.foundations.map((pile, index) => {
            const card = pile.at(-1);
            return <button key={index} onClick={() => selectFoundation(index)} aria-label={card ? `Foundation ${card.suit}, top card ${RANKS[card.rank]}` : `Empty ${SUITS[index]} foundation`} className="min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan">
              {card ? <CardFace card={card} selected={selection?.area === "foundation" && selection.index === index} /> :
                <div className={`grid aspect-[5/7] place-items-center rounded-lg border border-dashed border-white/25 text-[clamp(14px,4vw,25px)] ${isRed(SUITS[index]) ? "text-rose-300/70" : "text-white/55"}`}>{SUITS[index]}</div>}
              <span className="mt-1 block text-center text-[10px] text-gray-400">{SUITS[index]}</span>
            </button>;
          })}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {game.tableau.map((pile, column) => (
            <div key={column} className="flex min-w-0 flex-col">
              {pile.length === 0 && <button aria-label={`Move selected card to empty column ${column + 1}`} onClick={() => moveToTableau(column)} className="aspect-[5/7] w-full rounded-lg border border-dashed border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan" />}
              {pile.map((card, cardIndex) => (
                <button key={card.id} onClick={() => card.faceUp && selectTableau(column, cardIndex)}
                  aria-label={card.faceUp ? `${RANKS[card.rank]} of ${card.suit}${selection?.area === "tableau" && selection.index === column && (selection.cardIndex ?? 0) <= cardIndex ? ", selected" : ""}` : "Face-down card"}
                  disabled={!card.faceUp}
                  className={`w-full min-w-0 rounded-lg text-left disabled:cursor-default focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan ${cardIndex ? "-mt-[88%]" : ""}`}>
                  <CardFace card={card} selected={selection?.area === "tableau" && selection.index === column && (selection.cardIndex ?? 0) <= cardIndex} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {game.won ? <div role="status" className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-center font-bold text-amber-200">You did it! All 52 cards are home. 🎉</div> :
        <p className="text-center text-xs text-gray-500">Select a card or stack, then select a destination. Build alternating colors down; build each suit from Ace to King.</p>}
      <ScoreLeaderboard gameId="solitaire" score={game.won ? Math.max(bestScore, game.score) : bestScore} canPost={game.won} />
    </section>
  );
}
