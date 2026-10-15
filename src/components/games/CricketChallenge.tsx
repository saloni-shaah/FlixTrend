'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trophy, Flame, Target, Zap, Check } from 'lucide-react';
import { iplTeams, internationalTeams } from '@/lib/cricket-data';

// ---------- CONFIG ----------
const W = 360, H = 560, HOR = 150, BASE = 500, K = 2.2;
const P_IDEAL = 0.926;
const KEY = 'cricketHighScore';
type Game = Record<string, any>;
type SetupStep = 'tournament' | 'team' | 'overs';
type Tournament = 'IPL' | 'ICC';
type Cam = { x: number; y: number; zoom: number };

const KINDS: Record<string, { T: number; tb: number; hp: number; turn: number; w: number }> = {
    Pace: { T: 0.8, tb: 0.74, hp: 0.32, turn: 0, w: 28 },
    Medium: { T: 0.95, tb: 0.7, hp: 0.3, turn: 0, w: 20 },
    Spin: { T: 1.15, tb: 0.68, hp: 0.28, turn: 0.22, w: 18 },
    Slower: { T: 1.3, tb: 0.66, hp: 0.25, turn: 0, w: 12 },
    Yorker: { T: 0.78, tb: 0.88, hp: 0.1, turn: 0, w: 12 },
    Bouncer: { T: 0.85, tb: 0.5, hp: 1.0, turn: 0, w: 10 },
};
const FIELDERS = [
    { x: -1.0, z: 0.2 }, { x: 1.0, z: 0.3 }, { x: -1.2, z: 0.95 }, { x: 1.2, z: 1.0 },
    { x: -0.65, z: 1.55 }, { x: 0.65, z: 1.6 }, { x: 0, z: 1.85 }, { x: -0.45, z: 0.75 },
];
const COMM: Record<string, string[]> = {
    six: ['Out of the park!', 'That is MASSIVE!', 'Into the stands!', 'Clean as a whistle!'],
    four: ['Pierces the gap!', 'Races to the rope!', 'Textbook timing!', 'Cracked away!'],
    out: ['Big wicket!', 'Gone! Huge moment!', 'The crowd goes silent...'],
    dot: ['Beaten all ends up!', 'Dot ball. Pressure builds.', 'Nothing doing.'],
    run: ['Pushed into the gap.', 'Smart cricket.', 'Keeps the board moving.'],
};
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hueOf = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

// ---------- PROJECTION ----------
const sc = (z: number) => 1 / (1 + K * Math.max(z, -0.35));
const proj = (c: Cam, x: number, z: number, h = 0) => {
    const s = sc(z) * c.zoom;
    return { x: W / 2 + (x - c.x) * s * W * 0.9, y: HOR + c.y + (BASE - HOR) * s - h * s * 320, s };
};
const inside = (x: number, z: number) => (x / 1.7) ** 2 + ((z - 0.55) / 2) ** 2 < 1;

// ---------- DELIVERY ----------
function makeDel(over: number) {
    const tot = Object.values(KINDS).reduce((a, k) => a + k.w, 0) + over;
    let r = Math.random() * tot, kind = 'Pace';
    for (const [n, k] of Object.entries(KINDS)) { r -= k.w + (n === 'Yorker' || n === 'Bouncer' ? over * 0.5 : 0); if (r <= 0) { kind = n; break; } }
    const k = KINDS[kind];
    return {
        kind, T: k.T * Math.max(0.85, 1 - over * 0.01), tb: k.tb, hp: k.hp,
        x0: (Math.random() - 0.5) * 0.6, turn: k.turn * (Math.random() < 0.5 ? -1 : 1),
        noBall: Math.random() < 0.06,
    };
}
function pos(d: any, p: number) {
    const pp = Math.min(p, 1.05);
    const z = 1 - 1.08 * pp;
    const u = (pp - d.tb) / (1 - d.tb);
    const h = pp < d.tb ? 0.58 * (1 - (pp / d.tb) ** 1.8) : Math.max(0, 4 * d.hp * u * (1 - u));
    return { x: d.x0 + d.turn * Math.max(0, Math.min(1, u)), z, h };
}

// ---------- SHOT SIMULATION ----------
function simulate(x0: number, h0: number, aim: number, loft: boolean, pow: number) {
    const th = aim * 1.2, sp = (loft ? 3.3 : 3.0) * pow;
    let x = x0, z = 0.05, h = Math.max(0.15, h0);
    let vx = Math.sin(th) * sp, vz = Math.cos(th) * sp, vh = loft ? 1.9 * pow : 0.15;
    const path = [{ x, z, h }];
    let bounced = !loft, boundary = 0, out = false, fi = -1;
    const dt = 1 / 60;
    for (let i = 0; i < 480; i++) {
        vh -= 3.2 * dt; x += vx * dt; z += vz * dt; h += vh * dt;
        if (h <= 0) { h = 0; if (vh < -0.45) { vh *= -0.5; bounced = true; } else vh = 0; }
        if (h === 0 && vh === 0) { const f = 1 - 0.9 * dt; vx *= f; vz *= f; }
        path.push({ x, z, h });
        if (!inside(x, z)) { boundary = bounced ? 4 : 6; break; }
        for (let j = 0; j < FIELDERS.length; j++) {
            const f = FIELDERS[j];
            if (Math.hypot(x - f.x, z - f.z) < 0.15) {
                if (!bounced && vh < 0 && h < 0.5) { out = true; fi = j; }
                else if (bounced && h < 0.5) fi = j;
                if (fi === j) break;
            }
        }
        if (fi >= 0) break;
        if (h === 0 && vh === 0 && Math.hypot(vx, vz) < 0.12) break;
    }
    const d = Math.hypot(x - path[0].x, z - path[0].z);
    const runs = out ? 0 : d < 0.45 ? 0 : d < 1.1 ? 1 : d < 1.8 ? 2 : 3;
    return { path, runs, out, boundary, fi };
}
function edgeSim(x0: number, h0: number) {
    const path = [];
    for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        path.push({ x: x0 + t * 0.25, z: 0.05 - t * 0.4, h: Math.max(0.1, h0 + Math.sin(t * Math.PI) * 0.45) });
    }
    return { path, runs: 0, out: true, boundary: 0, fi: -1 };
}

// ---------- GAME LOGIC ----------
function addText(g: Game, t: string, c: string, size = 54) { g.texts.push({ t, c, size, age: 0, life: 1.3 }); }
function burst(g: Game, x: number, y: number, n: number, colors: string[], speed: number) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random());
        g.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, g: 400, life: 0.8 + Math.random() * 0.6, max: 1.4, c: colors[i % colors.length], size: 3 + Math.random() * 3 });
    }
}
function confetti(g: Game) {
    const cols = ['#4ade80', '#22d3ee', '#f472b6', '#facc15', '#a78bfa'];
    for (let i = 0; i < 110; i++)
        g.parts.push({ x: Math.random() * W, y: -10 - Math.random() * 80, vx: (Math.random() - 0.5) * 80, vy: 60 + Math.random() * 140, g: 60, life: 2 + Math.random(), max: 3, c: cols[i % 5], size: 4 + Math.random() * 4 });
}

function startBall(g: Game) {
    const overIdx = Math.floor((g.total - g.balls) / 6);
    g.del = makeDel(overIdx);
    Object.assign(g, { phase: 'run', pt: 0, bt: 0, swing: null, plan: null, path: null, res: null, bowledT: 0, trail: [], comm: '', fx: FIELDERS.map(f => ({ ...f })) });
}

function startGame(g: Game) {
    Object.assign(g, { score: 0, wk: 0, balls: g.total, freeHit: false, streak: 0, fire: false, sixes: 0, fours: 0, over: false, won: false, ending: false, saved: false, newBest: false, parts: [], texts: [], cam: { x: 0, y: 0, zoom: 1 }, shake: 0, slow: 0, flash: 0 });
    startBall(g);
    g.notify();
}

function launch(g: Game) {
    const p = g.plan, d = g.del;
    const bp = pos(d, g.bt / d.T);
    const sim = p.grade === 'edge' ? edgeSim(bp.x, bp.h) : simulate(bp.x, bp.h, p.aim, p.loft, p.pow);
    g.res = sim; g.path = sim.path; g.pidx = 0; g.phase = 'fly'; g.pt = 0;
    g.slow = sim.boundary || p.pow > 0.95 ? 0.45 : 0;
    g.shake = sim.boundary === 6 ? 14 : sim.boundary === 4 ? 8 : 4;
    if (p.grade === 'perfect') addText(g, 'PERFECT', '#67e8f9', 26);
    const b = proj(g.cam, bp.x, 0.05, bp.h);
    burst(g, b.x, b.y, p.grade === 'perfect' ? 26 : 12, ['#fde047', '#fff', '#67e8f9'], 220);
}

function finish(g: Game, res: any, label?: string) {
    const nb = g.del.noBall, wasFree = g.freeHit;
    const out = res.out && !wasFree;
    const bd = res.boundary;
    const runs = bd || res.runs;
    if (nb) g.score += 1;
    g.score += runs;
    if (!nb) g.balls -= 1;
    if (out) g.wk += 1;
    if (bd === 6) g.sixes++;
    if (bd === 4) g.fours++;
    g.streak = bd ? g.streak + 1 : 0;
    g.fire = g.streak >= 2;
    g.freeHit = nb;
    if (nb) addText(g, 'NO BALL', '#fb923c', 32);
    if (out) { addText(g, 'OUT!', '#f87171'); g.comm = pick(COMM.out); g.shake = 12; }
    else if (wasFree && res.out) { addText(g, 'FREE HIT!', '#fb923c'); g.comm = 'Saved by the free hit!'; }
    else if (bd === 6) { addText(g, 'SIX!', '#4ade80', 72); g.comm = pick(COMM.six); g.flash = 1; confetti(g); }
    else if (bd === 4) { addText(g, 'FOUR!', '#60a5fa', 64); g.comm = pick(COMM.four); g.flash = 0.7; burst(g, W / 2, 260, 50, ['#60a5fa', '#fff', '#22d3ee'], 260); }
    else if (runs > 0) { addText(g, `${runs} RUN${runs > 1 ? 'S' : ''}`, '#facc15'); g.comm = pick(COMM.run); }
    else { addText(g, label || 'DOT', '#cbd5e1', 40); g.comm = pick(COMM.dot); }
    g.ending = g.score >= g.target || g.wk >= g.maxW || g.balls <= 0;
    g.phase = 'res'; g.pt = 0;
    g.notify();
}

function resolveMiss(g: Game) {
    const e = pos(g.del, P_IDEAL);
    const bowled = Math.abs(e.x) < 0.1 && e.h < 0.7 && !g.freeHit;
    if (bowled) { g.bowledT = 0.001; g.shake = 10; }
    finish(g, { runs: 0, out: bowled, boundary: 0 }, g.swing ? 'MISSED' : 'LEFT');
}

function doSwing(g: Game | null, px: number, py: number) {
    if (!g || g.phase !== 'bowl' || g.swing || g.over) return;
    const d = g.del, t = g.bt;
    if (t / d.T < 0.4) return;
    const contact = t + 0.07;
    const dd = contact - P_IDEAL * d.T, ad = Math.abs(dd), w = g.fire ? 1.25 : 1;
    const bp = pos(d, contact / d.T);
    let grade = ad < 0.04 * w ? 'perfect' : ad < 0.08 * w ? 'good' : ad < 0.13 * w ? 'ok' : ad < 0.17 ? 'edge' : 'miss';
    if (Math.abs(bp.x) > 0.5 || bp.h > 0.95) grade = 'miss';
    const loft = py < 0.5;
    let pow = grade === 'perfect' ? 1 : grade === 'good' ? 0.78 : 0.52;
    if (d.kind === 'Bouncer' && !loft) pow *= 0.5;
    if (d.kind === 'Yorker' && loft) pow *= 0.65;
    const aim = clamp((px - 0.5) * 2 + dd * 2.5, -1, 1);
    g.swing = { t: 0, aim, loft };
    g.plan = { grade, aim, loft, pow, at: contact };
}

function step(g: Game, dt: number) {
    g.pt += dt;
    g.shake = Math.max(0, g.shake - dt * 40);
    g.flash = Math.max(0, g.flash - dt * 1.6);
    if (g.swing) g.swing.t += dt;
    if (g.bowledT > 0) g.bowledT += dt;
    for (const p of g.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
    g.parts = g.parts.filter((p: any) => p.life > 0);
    for (const t of g.texts) t.age += dt;
    g.texts = g.texts.filter((t: any) => t.age < t.life);
    const cam = g.cam as Cam;
    let tx = 0, tz = 1, ty = 0;

    if (g.over) return;
    if (g.phase === 'run' && g.pt >= 0.9) {
        g.phase = 'bowl'; g.bt = 0;
        if (g.del.noBall) addText(g, 'NO BALL!', '#fb923c', 34);
    } else if (g.phase === 'bowl') {
        g.bt += dt;
        const b = pos(g.del, g.bt / g.del.T);
        const sp = proj(cam, b.x, b.z, b.h);
        g.trail.push({ x: sp.x, y: sp.y, s: sp.s });
        if (g.trail.length > 12) g.trail.shift();
        if (g.plan && g.plan.grade !== 'miss' && g.bt >= g.plan.at) launch(g);
        else if (g.bt / g.del.T >= 1.05) resolveMiss(g);
    } else if (g.phase === 'fly') {
        const ts = g.slow > 0 ? 0.4 : 1;
        g.slow -= dt;
        g.pidx += dt * 60 * ts;
        const i = Math.min(Math.floor(g.pidx), g.path.length - 1);
        const b = g.path[i];
        const sp = proj(cam, b.x, b.z, b.h);
        g.trail.push({ x: sp.x, y: sp.y, s: sp.s });
        if (g.trail.length > 18) g.trail.shift();
        tx = clamp(b.x * 0.55, -0.9, 0.9);
        tz = g.res.boundary === 6 ? 0.78 : g.plan.loft ? 0.86 : 0.93;
        ty = -b.h * 14;
        if (g.res.fi >= 0) {
            const f = FIELDERS[g.res.fi], e = g.path[g.path.length - 1], k = clamp(g.pidx / g.path.length, 0, 1);
            g.fx[g.res.fi] = { x: lerp(f.x, e.x, k), z: lerp(f.z, e.z, k) };
        }
        if (g.pidx >= g.path.length - 1) finish(g, g.res);
    } else if (g.phase === 'res') {
        if (g.pt >= (g.res?.boundary ? 1.7 : 1.3)) {
            if (g.ending) { g.over = true; g.won = g.score >= g.target; g.notify(); }
            else startBall(g);
        }
    }
    const k = 1 - Math.exp(-5 * dt);
    cam.x = lerp(cam.x, tx, k); cam.zoom = lerp(cam.zoom, tz, k); cam.y = lerp(cam.y, ty, k);
}

// ---------- RENDERING ----------
function figure(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, jersey: string, helmet: string, pads = false) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 26 * u, 6 * u, 0, 0, 7); ctx.fill();
    ctx.lineCap = 'round'; ctx.strokeStyle = pads ? '#f1f5f9' : '#1e293b'; ctx.lineWidth = 13 * u;
    ctx.beginPath(); ctx.moveTo(x - 9 * u, y - 100 * u); ctx.lineTo(x - 12 * u, y - 4 * u);
    ctx.moveTo(x + 9 * u, y - 100 * u); ctx.lineTo(x + 13 * u, y - 4 * u); ctx.stroke();
    ctx.fillStyle = jersey; ctx.beginPath(); ctx.roundRect(x - 22 * u, y - 178 * u, 44 * u, 82 * u, 10 * u); ctx.fill();
    ctx.fillStyle = '#d6a27c'; ctx.beginPath(); ctx.arc(x, y - 196 * u, 14 * u, 0, 7); ctx.fill();
    ctx.fillStyle = helmet; ctx.beginPath(); ctx.arc(x, y - 200 * u, 16 * u, Math.PI, 0); ctx.fill();
}

function stumps(ctx: CanvasRenderingContext2D, c: Cam, z: number, brk: number) {
    const b = proj(c, 0, z), u = b.s, hh = 96 * u, gap = 11 * u;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.translate(b.x + i * gap + i * brk * 40 * u, b.y - brk * 8 * u);
        ctx.rotate(i * brk * 0.9 + (brk > 0 ? 0.2 * brk : 0));
        ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = Math.max(2, 4 * u);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -hh); ctx.stroke();
        ctx.restore();
    }
    if (brk < 0.3) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = Math.max(1.5, 3 * u); ctx.beginPath(); ctx.moveTo(b.x - gap, b.y - hh); ctx.lineTo(b.x + gap, b.y - hh); ctx.stroke(); }
}

function drawBall(ctx: CanvasRenderingContext2D, g: Game, b: { x: number; z: number; h: number }) {
    const c = g.cam as Cam, p = proj(c, b.x, b.z, b.h), sh = proj(c, b.x, b.z, 0);
    const r = Math.max(3.4, 9 * p.s);
    for (let i = 0; i < g.trail.length; i++) {
        const t = g.trail[i], a = i / g.trail.length;
        ctx.fillStyle = `rgba(255,255,255,${a * 0.35})`; ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(1.5, 8 * t.s * a), 0, 7); ctx.fill();
    }
    ctx.fillStyle = `rgba(0,0,0,${0.35 / (1 + b.h)})`; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, r * 1.3, r * 0.45, 0, 0, 7); ctx.fill();
    const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.4);
    gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(0.8, r * 0.18);
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.7, 0.6, 2.5); ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, g: Game, time: number) {
    const c = g.cam as Cam;
    ctx.save();
    if (g.shake > 0.1) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    const hy = HOR + c.y;
    // sky + stands
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#04061a'); sky.addColorStop(1, '#232a66');
    ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.fillStyle = '#0d1030'; ctx.fillRect(-20, hy - 120, W + 40, 120);
    for (const d of g.crowd) {
        const a = clamp(0.35 + 0.4 * Math.sin(time * 3 + d.ph) + g.flash * 0.6, 0.1, 1);
        ctx.fillStyle = d.c; ctx.globalAlpha = a;
        ctx.fillRect(d.x * W, hy - 118 + d.y * 112, 2.2, 2.2);
    }
    ctx.globalAlpha = 1;
    for (const lx of [40, W - 40]) {
        const lg = ctx.createRadialGradient(lx, 18, 0, lx, 18, 150);
        lg.addColorStop(0, 'rgba(255,255,230,.55)'); lg.addColorStop(1, 'rgba(255,255,230,0)');
        ctx.fillStyle = lg; ctx.fillRect(lx - 150, 0, 300, 180);
    }
    // ground
    ctx.fillStyle = '#14532d'; ctx.fillRect(-20, hy, W + 40, H);
    const ring: { x: number; y: number }[] = [];
    for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; ring.push(proj(c, 1.7 * Math.cos(a), 0.55 + 2 * Math.sin(a))); }
    ctx.save();
    ctx.beginPath(); ring.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#1f7a3a'; ctx.fillRect(-20, 0, W + 40, H);
    for (let i = 0; i < 14; i++) {
        const z0 = -0.5 + i * 0.25, a = proj(c, -3, z0), b = proj(c, 3, z0), cc = proj(c, 3, z0 + 0.25), d = proj(c, -3, z0 + 0.25);
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.05)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(cc.x, cc.y); ctx.lineTo(d.x, d.y); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ring.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke();
    // pitch
    const p1 = proj(c, -0.13, -0.3), p2 = proj(c, 0.13, -0.3), p3 = proj(c, 0.13, 1.06), p4 = proj(c, -0.13, 1.06);
    ctx.fillStyle = '#b8895a'; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.fill();
    for (const zz of [0.05, 1.0]) {
        const a = proj(c, -0.3, zz), b = proj(c, 0.3, zz);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    stumps(ctx, c, 1.0, 0);
    // bowler
    const run = g.phase === 'run' ? clamp(g.pt / 0.9, 0, 1) : 1;
    const bz = g.phase === 'run' ? lerp(1.6, 1.0, run) : 1.0;
    const bp = proj(c, 0.02, bz), bu = bp.s;
    const ph = g.pt * 14, bob = g.phase === 'run' ? Math.abs(Math.sin(ph)) * 6 * bu : 0;
    figure(ctx, bp.x, bp.y - bob, bu, '#ef4444', '#b91c1c');
    const arm = g.phase === 'bowl' ? lerp(3.14, 0.4, clamp(g.bt / 0.2, 0, 1)) : 2.2 + Math.sin(ph) * 0.5;
    ctx.strokeStyle = '#d6a27c'; ctx.lineWidth = 9 * bu; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bp.x + 20 * bu, bp.y - bob - 165 * bu); ctx.lineTo(bp.x + 20 * bu + Math.sin(arm) * 70 * bu, bp.y - bob - 165 * bu + Math.cos(arm) * 70 * bu); ctx.stroke();
    // fielders (far → near)
    const fs = g.fx.map((f: any, i: number) => ({ ...f, i })).sort((a: any, b: any) => b.z - a.z);
    for (const f of fs) { const p = proj(c, f.x, f.z); figure(ctx, p.x, p.y, p.s * 0.9, '#ef4444', '#991b1b'); }
    // ball (before batter when far)
    let ballPos: { x: number; z: number; h: number } | null = null;
    if (g.phase === 'bowl' && g.bt / g.del.T <= 1.05) ballPos = pos(g.del, g.bt / g.del.T);
    else if (g.phase === 'fly') ballPos = g.path[Math.min(Math.floor(g.pidx), g.path.length - 1)];
    if (ballPos) drawBall(ctx, g, ballPos);
    // timing ring
    if (g.phase === 'bowl' && !g.swing) {
        const e = pos(g.del, P_IDEAL), rp = proj(c, e.x, 0.03, 0.22);
        const dd = Math.abs(g.bt + 0.07 - P_IDEAL * g.del.T), good = dd < 0.04 * (g.fire ? 1.25 : 1);
        ctx.strokeStyle = good ? '#4ade80' : 'rgba(255,255,255,.28)'; ctx.lineWidth = good ? 3 : 1.5;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, 18 + Math.min(40, dd * 120), 0, 7); ctx.stroke();
    }
    // batter
    stumps(ctx, c, 0, clamp(g.bowledT * 2, 0, 1));
    const bt = proj(c, -0.38, 0.02), u = bt.s;
    figure(ctx, bt.x, bt.y, u, `hsl(${g.hue} 70% 45%)`, `hsl(${g.hue} 70% 25%)`, true);
    const q = g.swing ? clamp(g.swing.t / 0.24, 0, 1) : 0;
    const e = 1 - (1 - q) ** 3;
    let ang: number;
    if (g.swing) ang = lerp(-0.4, g.swing.loft ? 3.9 : 3.2 + g.swing.aim * 0.3, e);
    else if (g.phase === 'bowl') ang = lerp(2.9, 0.4, clamp(g.bt / (g.del.T * 0.6), 0, 1));
    else ang = 2.9;
    const hx = bt.x + 14 * u, hy2 = bt.y - 115 * u, dx = Math.sin(ang), dy = -Math.cos(ang);
    ctx.strokeStyle = '#d6a27c'; ctx.lineWidth = 9 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bt.x, bt.y - 165 * u); ctx.lineTo(hx, hy2); ctx.stroke();
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(hx, hy2); ctx.lineTo(hx + dx * 28 * u, hy2 + dy * 28 * u); ctx.stroke();
    ctx.strokeStyle = '#e8c58f'; ctx.lineWidth = 15 * u; ctx.beginPath(); ctx.moveTo(hx + dx * 28 * u, hy2 + dy * 28 * u); ctx.lineTo(hx + dx * 118 * u, hy2 + dy * 118 * u); ctx.stroke();
    if (g.fire) { ctx.strokeStyle = 'rgba(251,146,60,.7)'; ctx.lineWidth = 4 * u; ctx.stroke(); }
    // bowler label
    if (g.phase === 'bowl' && g.bt < 0.5) {
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(g.del.kind.toUpperCase() + (g.freeHit ? ' · FREE HIT' : ''), W / 2, 40);
    }
    // particles
    for (const p of g.parts) { ctx.globalAlpha = clamp(p.life / p.max * 2, 0, 1); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.size, p.size); }
    ctx.globalAlpha = 1;
    // flash + vignette
    if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash * 0.18})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = vg; ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.restore();
    // texts
    for (const t of g.texts) {
        const pop = 1 + 0.4 * Math.max(0, 1 - t.age * 6), a = clamp((t.life - t.age) / 0.3, 0, 1);
        ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, 210 - t.age * 14); ctx.scale(pop, pop);
        ctx.font = `900 ${t.size}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.6)';
        ctx.strokeText(t.t, 0, 0); ctx.fillStyle = t.c; ctx.fillText(t.t, 0, 0); ctx.restore();
    }
    if (g.comm && g.phase === 'res') {
        ctx.font = '600 13px sans-serif'; ctx.textAlign = 'center';
        const tw = ctx.measureText(g.comm).width + 24;
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2, H - 46, tw, 28, 14); ctx.fill();
        ctx.fillStyle = '#e2e8f0'; ctx.fillText(g.comm, W / 2, H - 28);
    }
}

// ---------- COMPONENT ----------
type Hud = { score: number; wk: number; maxW: number; balls: number; target: number; free: boolean; fire: boolean; missions: { label: string; n: number; goal: number }[]; over: boolean; won: boolean; sixes: number; fours: number; newBest: boolean };
const HUD0: Hud = { score: 0, wk: 0, maxW: 3, balls: 6, target: 10, free: false, fire: false, missions: [], over: false, won: false, sixes: 0, fours: 0, newBest: false };

export function CricketChallenge() {
    const [screen, setScreen] = useState<'setup' | 'play'>('setup');
    const [setupStep, setSetupStep] = useState<SetupStep>('tournament');
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
    const [totalOvers, setTotalOvers] = useState(1);
    const [hud, setHud] = useState<Hud>(HUD0);
    const [best, setBest] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const G = useRef<Game | null>(null);
    const cfg = useRef({ overs: 1, team: null as any });
    cfg.current = { overs: totalOvers, team: selectedTeam };

    useEffect(() => {
        try { const v = localStorage.getItem(KEY); if (v) setBest(parseInt(v, 10) || 0); } catch { /* ignore */ }
    }, []);

    const buildGame = (): Game => {
        const overs = cfg.current.overs, balls = overs * 6;
        const mult = ({ 1: 1.9, 6: 1.7, 20: 1.5, 50: 1.1 } as Record<number, number>)[overs] ?? 1.5;
        const cols = ['#67e8f9', '#f9a8d4', '#fde68a', '#fff', '#a5b4fc'];
        const g: Game = {
            total: balls, target: Math.round(balls * mult),
            maxW: overs <= 1 ? 2 : overs <= 6 ? 3 : overs <= 20 ? 5 : 8,
            hue: hueOf(cfg.current.team?.name || 'x'),
            missions: [
                { k: 'sixes', goal: Math.max(1, Math.round(balls / 12)), text: 'Hit sixes' },
                { k: 'fours', goal: Math.max(2, Math.round(balls / 8)), text: 'Hit fours' },
            ],
            crowd: Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), ph: Math.random() * 6, c: cols[Math.floor(Math.random() * 5)] })),
        };
        g.notify = () => {
            if (g.over && !g.saved) {
                g.saved = true;
                let b = 0;
                try { b = Number(localStorage.getItem(KEY) || 0); } catch { /* ignore */ }
                if (g.score > b) { g.newBest = true; try { localStorage.setItem(KEY, String(g.score)); } catch { /* ignore */ } setBest(g.score); }
            }
            setHud({
                score: g.score, wk: g.wk, maxW: g.maxW, balls: g.balls, target: g.target, free: g.freeHit, fire: g.fire,
                missions: g.missions.map((m: any) => ({ label: m.text, n: Math.min(m.goal, g[m.k]), goal: m.goal })),
                over: g.over, won: g.won, sixes: g.sixes, fours: g.fours, newBest: g.newBest,
            });
        };
        return g;
    };

    useEffect(() => {
        if (screen !== 'play') return;
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const g = buildGame(); G.current = g; startGame(g);
        let raf = 0, last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000); last = now;
            step(g, dt); draw(ctx, g, now / 1000);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); doSwing(g, 0.5, 0.7); } };
        window.addEventListener('keydown', onKey);
        const onHide = () => { last = performance.now(); };
        document.addEventListener('visibilitychange', onHide);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onHide); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    const handleConfigSelect = (step: SetupStep, value: any) => {
        if (step === 'tournament') { setTournament(value); setSetupStep('team'); }
        else if (step === 'team') { setSelectedTeam(value); setSetupStep('overs'); }
        else { setTotalOvers(value); setScreen('play'); }
    };

    const onPointer = (e: React.PointerEvent) => {
        const r = canvasRef.current!.getBoundingClientRect();
        doSwing(G.current, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };

    const rematch = () => { if (G.current) startGame(G.current); };
    const teamOptions = tournament === 'IPL' ? iplTeams : internationalTeams;
    const need = Math.max(0, hud.target - hud.score);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg glass-card p-4 flex flex-col items-center gap-3">
            <h2 className="text-3xl font-headline text-accent-green">Super Over Challenge</h2>

            {screen === 'setup' ? (
                <AnimatePresence mode="wait">
                    <motion.div key={setupStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full">
                        {setupStep === 'tournament' && (
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-xl font-bold text-accent-cyan">Choose Tournament</h3>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('tournament', 'IPL')}>IPL</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('tournament', 'ICC')}>ICC World Cup</button>
                            </div>
                        )}
                        {setupStep === 'team' && (
                            <div>
                                <h3 className="text-xl font-bold text-accent-cyan text-center mb-4">Select Your Team</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {teamOptions.map((team: any) => (
                                        <div key={team.name} className="glass-card p-3 text-center cursor-pointer hover:border-accent-pink" onClick={() => handleConfigSelect('team', team)}>
                                            <img src={team.logo} alt={team.name} className="w-20 h-20 mx-auto object-contain mb-2" />
                                            <p className="font-bold text-sm">{team.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {setupStep === 'overs' && (
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-xl font-bold text-accent-cyan">Choose Format</h3>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 1)}>Super Over (1 Over · 2 wickets)</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 6)}>Powerplay (6 Overs · 3 wickets)</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 20)}>T20 Match (20 Overs · 5 wickets)</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 50)}>ODI Match (50 Overs · 8 wickets)</button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <>
                    <div className="flex w-full items-center justify-between font-bold">
                        <div className="flex items-center gap-2 text-accent-cyan text-lg">
                            {selectedTeam && <img src={selectedTeam.logo} alt={selectedTeam.name} className="w-8 h-8 object-contain" />}
                            <span>{hud.score}/{hud.wk}</span>
                        </div>
                        <span className="text-xs text-gray-300 flex items-center gap-1"><Target size={14} /> Need {need} off {hud.balls}</span>
                        <span className="text-accent-pink text-sm">Best {best}</span>
                    </div>

                    <div className="flex min-h-[24px] w-full flex-wrap items-center gap-2 text-xs font-bold">
                        {hud.free && <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-orange-300 flex items-center gap-1"><Zap size={12} /> FREE HIT</span>}
                        {hud.fire && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-300 flex items-center gap-1"><Flame size={12} /> ON FIRE · wider timing</span>}
                        {hud.missions.map(m => (
                            <span key={m.label} className={`rounded-full px-2 py-0.5 flex items-center gap-1 ${m.n >= m.goal ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-300'}`}>
                                {m.n >= m.goal && <Check size={12} />}{m.label} {m.n}/{m.goal}
                            </span>
                        ))}
                    </div>

                    <div className="relative w-full select-none overflow-hidden rounded-xl border border-white/10" style={{ maxWidth: W, aspectRatio: `${W}/${H}` }}>
                        <canvas ref={canvasRef} onPointerDown={onPointer} className="h-full w-full touch-none cursor-pointer" style={{ width: '100%', height: '100%' }} />
                        <AnimatePresence>
                            {hud.over && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center">
                                    <Trophy className="text-brand-gold" size={40} />
                                    <h3 className={`text-3xl font-extrabold ${hud.won ? 'text-green-400' : 'text-red-400'}`}>{hud.won ? 'YOU WON!' : 'MATCH LOST'}</h3>
                                    <p className="text-gray-300">{hud.score}/{hud.wk} · Target {hud.target}</p>
                                    <p className="text-sm text-gray-400">{hud.sixes} sixes · {hud.fours} fours</p>
                                    {hud.newBest && <p className="font-bold text-brand-gold animate-pulse">New High Score!</p>}
                                    <div className="mt-2 flex gap-2">
                                        <button onClick={rematch} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2"><RotateCcw size={16} /> Rematch</button>
                                        <button onClick={() => { setScreen('setup'); setSetupStep('tournament'); }} className="btn-glass">Settings</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <p className="text-center text-xs text-gray-400">Tap when the ring turns green · tap HIGH = loft · LOW = ground · left/right = direction · Space = quick drive</p>
                    <button onClick={() => { setScreen('setup'); setSetupStep('tournament'); }} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2">
                        <RotateCcw size={16} /> Change Settings
                    </button>
                </>
            )}
        </motion.div>
    );
}