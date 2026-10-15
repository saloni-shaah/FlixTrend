"use client";
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Apple, Trophy,
    Star, Snowflake, Shield, Pause, Play, Flame,
} from 'lucide-react';

const GRID = 20;
const PER_LEVEL = 5;
const COMBO_WINDOW = 22; // ticks
const BEST_KEY = 'snakeHighScore';
const LEVEL_NAMES = [
    'Warm Up', 'Getting Spicy', 'Obstacle Course', 'Maze Runner', 'Speed Demon',
    'Neon Nights', 'Viper', 'Cobra', 'Anaconda', 'FlixTrend Legend',
];

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Pt = { x: number; y: number };
type Kind = 'star' | 'slow' | 'shield';
type Status = 'idle' | 'playing' | 'paused' | 'over';
type Pop = { id: number; x: number; y: number; text: string; ttl: number };

interface State {
    status: Status;
    snake: Pt[];
    dir: Dir;
    queue: Dir[];
    food: Pt;
    special: { pos: Pt; kind: Kind; ttl: number } | null;
    walls: Pt[];
    score: number;
    level: number;
    eaten: number;
    combo: number;
    comboTimer: number;
    slow: number;
    shield: boolean;
    banner: string;
    bannerTicks: number;
    pops: Pop[];
    uid: number;
}

type Action =
    | { type: 'START' }
    | { type: 'TICK' }
    | { type: 'PAUSE' }
    | { type: 'AUTOPAUSE' }
    | { type: 'DIR'; dir: Dir };

const VEC: Record<Dir, Pt> = {
    UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 },
};
const OPP: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const same = (a: Pt, b: Pt) => a.x === b.x && a.y === b.y;
const rnd = () => Math.floor(Math.random() * GRID);

function randomFree(taken: Pt[], avoid?: (p: Pt) => boolean): Pt {
    for (let i = 0; i < 200; i++) {
        const p = { x: rnd(), y: rnd() };
        if (!taken.some(t => same(t, p)) && !(avoid && avoid(p))) return p;
    }
    for (let y = 0; y < GRID; y++)
        for (let x = 0; x < GRID; x++)
            if (!taken.some(t => same(t, { x, y }))) return { x, y };
    return { x: 0, y: 0 };
}

function genWalls(level: number, snake: Pt[]): Pt[] {
    const count = Math.min(32, 3 + (level - 2) * 3);
    const h = snake[0];
    const near = (p: Pt) => Math.abs(p.x - h.x) + Math.abs(p.y - h.y) < 5;
    const walls: Pt[] = [];
    while (walls.length < count) {
        const p = randomFree([...snake, ...walls], near);
        walls.push(p);
        if (level >= 3 && walls.length < count && Math.random() < 0.5) {
            const q = Math.random() < 0.5 ? { x: p.x + 1, y: p.y } : { x: p.x, y: p.y + 1 };
            if (q.x < GRID && q.y < GRID && ![...snake, ...walls].some(t => same(t, q)) && !near(q)) walls.push(q);
        }
    }
    return walls;
}

const INITIAL: State = {
    status: 'idle',
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
    dir: 'RIGHT', queue: [], food: { x: 15, y: 10 }, special: null, walls: [],
    score: 0, level: 1, eaten: 0, combo: 1, comboTimer: 0, slow: 0, shield: false,
    banner: '', bannerTicks: 0, pops: [], uid: 0,
};
const fresh = (): State => ({ ...INITIAL, status: 'playing', food: randomFree(INITIAL.snake) });

function tick(s: State): State {
    if (s.status !== 'playing') return s;
    const dir = s.queue[0] ?? s.dir;
    const queue = s.queue.slice(1);
    const v = VEC[dir];
    const h = s.snake[0];
    let head: Pt = { x: h.x + v.x, y: h.y + v.y };
    let shield = s.shield;
    let walls = s.walls;
    const die = (): State => ({ ...s, status: 'over', dir, queue });

    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        if (!shield) return die();
        shield = false;
        head = { x: (head.x + GRID) % GRID, y: (head.y + GRID) % GRID };
    }
    if (walls.some(w => same(w, head))) {
        if (!shield) return die();
        shield = false;
        walls = walls.filter(w => !same(w, head));
    }
    if (s.snake.slice(0, -1).some(p => same(p, head))) {
        if (!shield) return die();
        shield = false;
    }

    const ate = same(head, s.food);
    const body = [head, ...s.snake];
    if (!ate) body.pop();

    let { score, level, eaten, combo, comboTimer, slow, banner, bannerTicks, uid } = s;
    let food = s.food;
    let special = s.special ? { ...s.special, ttl: s.special.ttl - 1 } : null;
    if (special && special.ttl <= 0) special = null;
    const pops = s.pops.map(p => ({ ...p, ttl: p.ttl - 1 })).filter(p => p.ttl > 0);
    comboTimer = Math.max(0, comboTimer - 1);
    if (comboTimer === 0) combo = 1;
    slow = Math.max(0, slow - 1);
    bannerTicks = Math.max(0, bannerTicks - 1);
    if (bannerTicks === 0) banner = '';
    const pop = (text: string) => { pops.push({ id: ++uid, x: head.x, y: head.y, text, ttl: 6 }); };

    if (special && same(head, special.pos)) {
        if (special.kind === 'star') { const pts = 50 * combo; score += pts; pop(`+${pts}`); }
        else if (special.kind === 'slow') { slow = 35; pop('SLOW-MO'); }
        else { shield = true; pop('SHIELD'); }
        special = null;
    }

    if (ate) {
        combo = comboTimer > 0 ? Math.min(5, combo + 1) : 1;
        comboTimer = COMBO_WINDOW;
        const pts = 10 * combo;
        score += pts;
        pop(`+${pts}`);
        eaten += 1;
        if (eaten >= PER_LEVEL) {
            level += 1;
            eaten = 0;
            score += 100;
            walls = genWalls(level, body);
            special = null;
            banner = `Level ${level} · ${LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]}`;
            bannerTicks = 16;
        }
        food = randomFree([...body, ...walls, ...(special ? [special.pos] : [])]);
        if (!special && Math.random() < 0.3) {
            const r = Math.random();
            const kind: Kind = r < 0.5 ? 'star' : r < 0.8 ? 'slow' : 'shield';
            special = { kind, pos: randomFree([...body, ...walls, food]), ttl: 45 };
        }
    }

    return { ...s, snake: body, dir, queue, food, special, walls, score, level, eaten, combo, comboTimer, slow, shield, banner, bannerTicks, pops, uid };
}

function reducer(s: State, a: Action): State {
    switch (a.type) {
        case 'START': return fresh();
        case 'TICK': return tick(s);
        case 'PAUSE':
            return s.status === 'playing' ? { ...s, status: 'paused' }
                : s.status === 'paused' ? { ...s, status: 'playing' } : s;
        case 'AUTOPAUSE': return s.status === 'playing' ? { ...s, status: 'paused' } : s;
        case 'DIR': {
            if (s.status !== 'playing') return s;
            const last = s.queue[s.queue.length - 1] ?? s.dir;
            if (a.dir === last || a.dir === OPP[last] || s.queue.length >= 2) return s;
            return { ...s, queue: [...s.queue, a.dir] };
        }
    }
}

const cell = (p: Pt): React.CSSProperties => ({
    left: `${p.x * (100 / GRID)}%`, top: `${p.y * (100 / GRID)}%`,
    width: `${100 / GRID}%`, height: `${100 / GRID}%`,
});

const KEY_MAP: Record<string, Dir> = {
    ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
    w: 'UP', W: 'UP', s: 'DOWN', S: 'DOWN', a: 'LEFT', A: 'LEFT', d: 'RIGHT', D: 'RIGHT',
};

export function Snake() {
    const [s, dispatch] = useReducer(reducer, INITIAL);
    const [best, setBest] = useState(0);
    const [newBest, setNewBest] = useState(false);
    const touchStart = useRef<Pt | null>(null);

    const base = Math.max(55, 180 - (s.level - 1) * 14);
    const interval = s.slow > 0 ? Math.round(base * 1.6) : base;
    const levelName = LEVEL_NAMES[Math.min(s.level - 1, LEVEL_NAMES.length - 1)];

    useEffect(() => {
        try {
            const v = localStorage.getItem(BEST_KEY);
            if (v) setBest(parseInt(v, 10) || 0);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (s.status !== 'over') return;
        navigator.vibrate?.(120);
        if (s.score > best) {
            setBest(s.score);
            setNewBest(true);
            try { localStorage.setItem(BEST_KEY, String(s.score)); } catch { /* ignore */ }
        }
    }, [s.status, s.score, best]);

    useEffect(() => {
        if (s.status !== 'playing') return;
        const id = setInterval(() => dispatch({ type: 'TICK' }), interval);
        return () => clearInterval(id);
    }, [s.status, interval]);

    useEffect(() => {
        const onHide = () => { if (document.hidden) dispatch({ type: 'AUTOPAUSE' }); };
        document.addEventListener('visibilitychange', onHide);
        return () => document.removeEventListener('visibilitychange', onHide);
    }, []);

    const start = useCallback(() => { setNewBest(false); dispatch({ type: 'START' }); }, []);

    const steer = useCallback((dir: Dir) => {
        if (s.status === 'idle') { start(); dispatch({ type: 'DIR', dir }); return; }
        dispatch({ type: 'DIR', dir });
    }, [s.status, start]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            const dir = KEY_MAP[e.key];
            if (dir) { e.preventDefault(); steer(dir); return; }
            if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                if (s.status === 'idle' || s.status === 'over') start();
                else dispatch({ type: 'PAUSE' });
            } else if (e.key === 'Enter' && s.status === 'over') start();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [steer, start, s.status]);

    const onTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        const st = touchStart.current;
        touchStart.current = null;
        if (!st) return;
        const dx = e.changedTouches[0].clientX - st.x;
        const dy = e.changedTouches[0].clientY - st.y;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
            if (s.status === 'idle') start();
            else if (s.status === 'paused') dispatch({ type: 'PAUSE' });
            return;
        }
        if (Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? 'RIGHT' : 'LEFT');
        else steer(dy > 0 ? 'DOWN' : 'UP');
    };

    const specialIcon = s.special && (
        s.special.kind === 'star' ? <Star className="h-full w-full p-px text-yellow-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.9)]" />
        : s.special.kind === 'slow' ? <Snowflake className="h-full w-full p-px text-sky-300 drop-shadow-[0_0_6px_rgba(125,211,252,0.9)]" />
        : <Shield className="h-full w-full p-px text-cyan-300 drop-shadow-[0_0_6px_rgba(103,232,249,0.9)]" />
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-4 sm:p-6 flex flex-col items-center gap-4"
        >
            <h2 className="text-3xl font-headline text-accent-green">Snake</h2>

            <div className="flex w-full justify-between font-bold">
                <motion.span key={s.score} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3 }} className="text-accent-cyan text-lg">
                    Score: {s.score}
                </motion.span>
                <span className="text-accent-pink text-lg">Best: {best}</span>
            </div>

            <div className="w-full space-y-1">
                <div className="flex justify-between text-xs text-gray-300">
                    <span>Lv {s.level} · {levelName}</span>
                    <span>{s.eaten}/{PER_LEVEL}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-pink"
                        animate={{ width: `${(s.eaten / PER_LEVEL) * 100}%` }}
                        transition={{ duration: 0.25 }}
                    />
                </div>
            </div>

            <div className="flex min-h-[24px] flex-wrap items-center gap-2 text-xs font-bold">
                {s.combo > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-orange-300">
                        <Flame size={12} /> x{s.combo}
                    </span>
                )}
                {s.shield && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/20 px-2 py-0.5 text-cyan-200">
                        <Shield size={12} /> Shield
                    </span>
                )}
                {s.slow > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/20 px-2 py-0.5 text-sky-200">
                        <Snowflake size={12} /> Slow-mo
                    </span>
                )}
            </div>

            <motion.div
                animate={s.status === 'over' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative aspect-square w-full max-w-[400px] touch-none overflow-hidden rounded-lg border-2 bg-black/30 transition-shadow ${
                    s.slow > 0
                        ? 'border-sky-400/60 shadow-[0_0_22px_rgba(56,189,248,0.45)]'
                        : 'border-accent-cyan/20 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                }`}
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: `${100 / GRID}% ${100 / GRID}%`,
                }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {s.walls.map((w, i) => (
                    <div key={`w${i}`} className="absolute p-px" style={cell(w)}>
                        <div className="h-full w-full rounded-sm border border-slate-300/30 bg-slate-400/60" />
                    </div>
                ))}

                {s.snake.map((seg, i) => (
                    <div key={i} className="absolute p-px" style={cell(seg)}>
                        <div
                            className={`h-full w-full rounded-sm ${
                                i === 0
                                    ? 'bg-accent-green shadow-[0_0_8px_rgba(57,255,20,0.7)]'
                                    : 'bg-green-400'
                            } ${s.shield ? 'ring-1 ring-cyan-300' : ''}`}
                            style={{ opacity: i === 0 ? 1 : Math.max(0.35, 0.9 - i * 0.025) }}
                        />
                    </div>
                ))}

                <div className="absolute flex items-center justify-center" style={cell(s.food)}>
                    <Apple className="h-full w-full p-px text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(255,50,50,0.8)]" />
                </div>

                {s.special && (
                    <motion.div
                        key={`${s.special.pos.x}-${s.special.pos.y}-${s.special.kind}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute ${s.special.ttl < 12 ? 'animate-pulse' : ''}`}
                        style={cell(s.special.pos)}
                    >
                        {specialIcon}
                    </motion.div>
                )}

                {s.pops.map(p => (
                    <div key={p.id} className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap"
                        style={{ left: `${(p.x + 0.5) * (100 / GRID)}%`, top: `${p.y * (100 / GRID)}%` }}>
                        <motion.div
                            initial={{ opacity: 1, y: 0 }}
                            animate={{ opacity: 0, y: -22 }}
                            transition={{ duration: 0.7 }}
                            className="text-[11px] font-extrabold text-yellow-200 drop-shadow"
                        >
                            {p.text}
                        </motion.div>
                    </div>
                ))}

                <AnimatePresence>
                    {s.banner && (
                        <motion.div
                            key={s.banner}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="pointer-events-none absolute inset-x-0 top-1/3 text-center"
                        >
                            <span className="rounded-full bg-black/60 px-4 py-2 text-lg font-bold text-accent-cyan backdrop-blur">
                                {s.banner}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {s.status === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-4 text-center backdrop-blur-sm">
                        <p className="text-lg font-bold text-white">Tap or press an arrow to start</p>
                        <div className="space-y-1 text-xs text-gray-300">
                            <p className="flex items-center justify-center gap-2"><Star size={14} className="text-yellow-300" /> Bonus points</p>
                            <p className="flex items-center justify-center gap-2"><Snowflake size={14} className="text-sky-300" /> Slow-mo</p>
                            <p className="flex items-center justify-center gap-2"><Shield size={14} className="text-cyan-300" /> Survive one crash</p>
                            <p className="pt-1 text-gray-400">Chain apples for combos · avoid walls</p>
                        </div>
                    </div>
                )}

                {s.status === 'paused' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
                        <p className="text-2xl font-bold text-white">Paused</p>
                    </div>
                )}
            </motion.div>

            {s.status === 'over' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center"
                >
                    <Trophy className="mx-auto mb-2 text-brand-gold" size={32} />
                    <h3 className="text-2xl font-bold text-red-500">Game Over!</h3>
                    <p className="text-gray-300">
                        Score {s.score} · Level {s.level} · Length {s.snake.length}
                    </p>
                    {newBest && s.score > 0 && <p className="animate-pulse font-bold text-brand-gold">New High Score!</p>}
                </motion.div>
            )}

            <div className="flex flex-col items-center gap-4">
                <div className="hidden md:grid grid-cols-3 gap-2">
                    <div />
                    <button aria-label="Up" className="btn-glass p-4" onClick={() => steer('UP')}><ArrowUp /></button>
                    <div />
                    <button aria-label="Left" className="btn-glass p-4" onClick={() => steer('LEFT')}><ArrowLeft /></button>
                    <button aria-label="Down" className="btn-glass p-4" onClick={() => steer('DOWN')}><ArrowDown /></button>
                    <button aria-label="Right" className="btn-glass p-4" onClick={() => steer('RIGHT')}><ArrowRight /></button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => dispatch({ type: 'PAUSE' })}
                        disabled={s.status !== 'playing' && s.status !== 'paused'}
                        className="btn-glass flex items-center gap-2 disabled:opacity-40"
                    >
                        {s.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                        {s.status === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={start} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2">
                        <RotateCcw size={16} /> New Game
                    </button>
                </div>
            </div>
        </motion.div>
    );
}