"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Coins, RotateCcw, Trophy } from "lucide-react";
import { ScoreLeaderboard } from "./ScoreLeaderboard";

type Thing = { lane: number; depth: number; kind: "jump" | "slide" | "train" | "coin" };
type Run = {
  running: boolean;
  ended: boolean;
  lane: number;
  things: Thing[];
  distance: number;
  coins: number;
  elapsed: number;
  nextSpawn: number;
  jumpUntil: number;
  slideUntil: number;
  lastHud: number;
};

const freshRun = (): Run => ({
  running: false, ended: false, lane: 1, things: [], distance: 0, coins: 0,
  elapsed: 0, nextSpawn: 650, jumpUntil: 0, slideUntil: 0, lastHud: 0,
});

function drawScene(canvas: HTMLCanvasElement, run: Run, now: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
  }
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const horizon = height * 0.28;
  const center = width / 2;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#10102c");
  sky.addColorStop(0.55, "#302056");
  sky.addColorStop(1, "#090b17");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#19152f";
  for (let i = 0; i < 12; i++) {
    const buildingWidth = width / 13;
    const x = i * buildingWidth + ((i * 31) % 13);
    const buildingHeight = height * (0.09 + ((i * 17) % 12) / 100);
    ctx.fillRect(x, horizon - buildingHeight, buildingWidth * 0.78, buildingHeight);
    ctx.fillStyle = "#f4c66a";
    for (let row = 0; row < 3; row++) {
      if ((i + row) % 3 !== 0) ctx.fillRect(x + buildingWidth * 0.18, horizon - buildingHeight + 8 + row * 10, 3, 3);
    }
    ctx.fillStyle = "#19152f";
  }
  ctx.fillStyle = "#f9b85f";
  ctx.shadowColor = "#ff9d55";
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(center, horizon - 12, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const left = width * 0.16;
  const right = width * 0.84;
  ctx.fillStyle = "#11111c";
  ctx.beginPath();
  ctx.moveTo(center - 8, horizon);
  ctx.lineTo(center + 8, horizon);
  ctx.lineTo(right, height);
  ctx.lineTo(left, height);
  ctx.closePath();
  ctx.fill();

  const roadX = (lanePosition: number, depth: number) => {
    const spread = 10 + depth * (width * 0.31);
    return center + (lanePosition - 1.5) * spread;
  };
  ctx.lineWidth = 2;
  for (const lane of [0, 1, 2, 3]) {
    const x = roadX(lane, 0);
    ctx.strokeStyle = lane === 0 || lane === 3 ? "rgba(48,225,238,.65)" : "rgba(255,255,255,.17)";
    ctx.beginPath();
    ctx.moveTo(x, horizon);
    ctx.lineTo(roadX(lane, 1), height);
    ctx.stroke();
  }
  const stripeOffset = (run.distance * 0.035) % 0.22;
  for (let i = 0; i < 6; i++) {
    const depth = (i * 0.22 + stripeOffset) % 1;
    const y = horizon + Math.pow(depth, 1.5) * (height - horizon);
    const stripeWidth = 2 + depth * 4;
    const stripeHeight = 2 + depth * 13;
    for (const lane of [0, 1, 2]) {
      const x = roadX(lane + 0.5, depth);
      ctx.fillStyle = "rgba(212,194,255,.36)";
      ctx.fillRect(x - stripeWidth / 2, y, stripeWidth, stripeHeight);
    }
  }

  for (const thing of run.things) {
    const depth = Math.max(0, Math.min(1, thing.depth));
    const x = roadX(thing.lane + 0.5, depth);
    const y = horizon + Math.pow(depth, 1.5) * (height - horizon);
    const scale = 0.24 + depth * 0.9;
    if (thing.kind === "coin") {
      ctx.save();
      ctx.shadowColor = "#ffd166";
      ctx.shadowBlur = 12 * scale;
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.ellipse(x, y - 12 * scale, 7 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff1b8";
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.restore();
      continue;
    }
    const obstacleWidth = (thing.kind === "train" ? 40 : 31) * scale;
    const obstacleHeight = (thing.kind === "train" ? 66 : 35) * scale;
    ctx.save();
    ctx.shadowBlur = 14 * scale;
    ctx.shadowColor = thing.kind === "jump" ? "#ff5d73" : thing.kind === "slide" ? "#b68cff" : "#39d9e6";
    ctx.fillStyle = thing.kind === "jump" ? "#e94d68" : thing.kind === "slide" ? "#8054bd" : "#177c91";
    ctx.fillRect(x - obstacleWidth / 2, y - obstacleHeight, obstacleWidth, obstacleHeight);
    ctx.fillStyle = "rgba(255,255,255,.32)";
    ctx.fillRect(x - obstacleWidth / 2 + obstacleWidth * 0.16, y - obstacleHeight + obstacleHeight * 0.15, obstacleWidth * 0.68, Math.max(2, obstacleHeight * 0.08));
    ctx.restore();
  }

  const playerX = roadX(run.lane + 0.5, 1);
  const jumping = now < run.jumpUntil;
  const sliding = now < run.slideUntil;
  const jumpLift = jumping ? Math.sin((run.jumpUntil - now) / 520 * Math.PI) * height * 0.1 : 0;
  const playerY = height * 0.82 - jumpLift;
  const playerWidth = Math.min(34, width * 0.09);
  const playerHeight = sliding ? 22 : 42;
  ctx.save();
  ctx.shadowColor = "#46e9ee";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#54e5ec";
  ctx.beginPath();
  ctx.roundRect(playerX - playerWidth / 2, playerY - playerHeight, playerWidth, playerHeight, 9);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(playerX, playerY - playerHeight + 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function NeonRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(freshRun());
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("neonRunnerBest") || 0));
    } catch (error) {
      console.error("Could not load the runner's best score.", error);
    }
  }, []);

  const start = useCallback(() => {
    runRef.current = { ...freshRun(), running: true };
    setDistance(0);
    setCoins(0);
    setGameOver(false);
    setPlaying(true);
    canvasRef.current?.focus();
  }, []);

  const move = useCallback((direction: "left" | "right" | "jump" | "slide") => {
    const run = runRef.current;
    if (!run.running) return;
    const now = performance.now();
    if (direction === "left") run.lane = Math.max(0, run.lane - 1);
    if (direction === "right") run.lane = Math.min(2, run.lane + 1);
    if (direction === "jump") { run.jumpUntil = now + 520; run.slideUntil = 0; }
    if (direction === "slide") { run.slideUntil = now + 520; run.jumpUntil = 0; }
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const canvas = canvasRef.current;
      const run = runRef.current;
      const delta = Math.min(now - previous, 50);
      previous = now;
      if (run.running) {
        run.elapsed += delta;
        run.distance += delta * (0.018 + Math.min(run.elapsed / 160000, 0.012));
        run.nextSpawn -= delta;
        if (run.nextSpawn <= 0) {
          const lane = Math.floor(Math.random() * 3);
          const roll = Math.random();
          run.things.push({ lane, depth: 0, kind: roll < 0.22 ? "coin" : roll < 0.5 ? "jump" : roll < 0.76 ? "slide" : "train" });
          if (roll < 0.22 && Math.random() < 0.7) {
            run.things.push({ lane, depth: -0.13, kind: "coin" }, { lane, depth: -0.26, kind: "coin" });
          }
          run.nextSpawn = Math.max(430, 920 - run.elapsed / 140);
        }
        for (const thing of run.things) {
          thing.depth += delta * (0.00031 + Math.min(run.elapsed / 900000, 0.00015));
          if (thing.depth >= 0.86 && thing.depth <= 1 && thing.lane === run.lane) {
            if (thing.kind === "coin") {
              thing.depth = 1.2;
              run.coins += 1;
            } else if ((thing.kind === "jump" && now >= run.jumpUntil) ||
              (thing.kind === "slide" && now >= run.slideUntil) ||
              thing.kind === "train") {
              run.running = false;
              run.ended = true;
              setPlaying(false);
              setGameOver(true);
              setDistance(Math.floor(run.distance));
              setCoins(run.coins);
              const score = Math.floor(run.distance) + run.coins * 25;
              setBest(current => {
                const next = Math.max(current, score);
                try { localStorage.setItem("neonRunnerBest", String(next)); }
                catch (error) { console.error("Could not save the runner's best score.", error); }
                return next;
              });
              break;
            }
          }
        }
        run.things = run.things.filter(thing => thing.depth < 1.08);
        if (now - run.lastHud > 120) {
          run.lastHud = now;
          setDistance(Math.floor(run.distance));
          setCoins(run.coins);
        }
      }
      if (canvas) drawScene(canvas, run, now);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const key = event.key.toLowerCase();
    const directions: Record<string, "left" | "right" | "jump" | "slide"> = {
      arrowleft: "left", a: "left", arrowright: "right", d: "right",
      arrowup: "jump", w: "jump", " ": "jump", arrowdown: "slide", s: "slide",
    };
    const direction = directions[key];
    if (direction) {
      event.preventDefault();
      move(direction);
    }
  };

  const onTouchEnd = (event: TouchEvent<HTMLCanvasElement>) => {
    const startPoint = touchRef.current;
    touchRef.current = null;
    if (!startPoint) return;
    const dx = event.changedTouches[0].clientX - startPoint.x;
    const dy = event.changedTouches[0].clientY - startPoint.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? "left" : "right");
    else move(dy < 0 ? "jump" : "slide");
  };

  return (
    <section className="glass-card mx-auto flex w-full max-w-lg flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-accent-cyan sm:text-3xl">Neon Rush</h2>
          <p className="mt-1 text-sm text-gray-400">An endless offline runner</p>
        </div>
        <button onClick={start} className="btn-glass flex items-center gap-2"><RotateCcw size={16} /> New run</button>
      </header>
      <div className="flex justify-between gap-2 text-sm">
        <span className="rounded-lg bg-white/[.06] px-3 py-2 text-gray-200">Distance <b className="ml-1 text-accent-cyan">{distance}m</b></span>
        <span className="flex items-center gap-1 rounded-lg bg-white/[.06] px-3 py-2 text-amber-300"><Coins size={15} /> {coins}</span>
        <span className="flex items-center gap-1 rounded-lg bg-white/[.06] px-3 py-2 text-amber-300"><Trophy size={15} /> {best}</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-accent-cyan/25 shadow-[0_0_28px_rgba(62,218,230,.12)]">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label="Neon Rush game. Focus the game and use arrow keys or WASD to dodge, jump, and slide."
          onKeyDown={onKeyDown}
          onTouchStart={event => { touchRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
          onTouchEnd={onTouchEnd}
          onClick={event => event.currentTarget.focus()}
          className="block aspect-[4/5] w-full touch-none outline-none"
        />
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 p-6 text-center backdrop-blur-[2px]">
            {gameOver ? (
              <>
                <Trophy className="mb-3 text-amber-300" size={34} />
                <h3 className="text-3xl font-bold text-white">Run over!</h3>
                <p className="mt-2 text-gray-300">You travelled {distance}m and collected {coins} coins.</p>
              </>
            ) : (
              <>
                <span className="mb-3 text-4xl">🏃</span>
                <h3 className="text-3xl font-bold text-white">Ready, runner?</h3>
                <p className="mt-2 max-w-xs text-sm text-gray-300">Switch lanes to dodge trains, jump barriers, slide under signs, and grab coins.</p>
              </>
            )}
            <button onClick={start} className="btn-glass mt-5 border-accent-cyan/40 bg-accent-cyan/15 font-bold text-accent-cyan">
              {gameOver ? "Run it back" : "Start running"}
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:hidden">
        {([
          ["left", <ArrowLeft size={20} />, "Left"],
          ["jump", <ArrowUp size={20} />, "Jump"],
          ["slide", <ArrowDown size={20} />, "Slide"],
          ["right", <ArrowRight size={20} />, "Right"],
        ] as const).map(([direction, icon, label]) => (
          <button key={direction} onClick={() => move(direction)} aria-label={label} className="btn-glass flex flex-col items-center gap-1 py-2 text-xs text-accent-cyan">
            {icon}{label}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500">← → switch lanes · ↑ jump · ↓ slide · swipe on mobile · Best score saved on this device</p>
      <ScoreLeaderboard gameId="neon-rush" score={best} canPost={gameOver} />
    </section>
  );
}
