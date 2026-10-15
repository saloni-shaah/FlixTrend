"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, MessageCircle, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";

export function ChatLobby() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.05, delayChildren: 0 } },
  };
  const item = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
  };

  return (
    <section className="signal-lobby relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-pink-50 px-6 py-8 text-slate-900 [--mist:125,170,255] dark:bg-[#080b18] dark:bg-none dark:text-white dark:[--mist:147,210,255] md:px-8 xl:px-12">
      {/* Backgrounds */}
      <div aria-hidden="true" className="signal-lobby__stars pointer-events-none absolute inset-0 hidden dark:block" />
      <div aria-hidden="true" className="signal-lobby__aurora signal-lobby__aurora--light pointer-events-none absolute inset-0 dark:hidden" />
      <div aria-hidden="true" className="signal-lobby__aurora signal-lobby__aurora--dark pointer-events-none absolute inset-0 hidden dark:block" />
      <div aria-hidden="true" className="signal-lobby__fog pointer-events-none absolute -top-52 left-[12%] bg-blue-400 opacity-30 dark:bg-blue-600 dark:opacity-[.16]" />
      <div aria-hidden="true" className="signal-lobby__fog signal-lobby__fog--alt pointer-events-none absolute -bottom-56 -right-48 bg-pink-300 opacity-35 dark:bg-pink-600 dark:opacity-[.16]" />
      <div aria-hidden="true" className="signal-lobby__fog signal-lobby__fog--mid pointer-events-none absolute left-[38%] top-[30%] bg-cyan-300 opacity-20 dark:bg-indigo-500 dark:opacity-[.12]" />
      <div aria-hidden="true" className="signal-lobby__mist signal-lobby__mist--1 pointer-events-none absolute inset-x-0 top-[18%]" />
      <div aria-hidden="true" className="signal-lobby__mist signal-lobby__mist--2 pointer-events-none absolute inset-x-0 bottom-[10%]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {[8, 22, 37, 55, 71, 86].map((left, i) => (
          <span
            key={left}
            className={`signal-lobby__mote ${i % 2 ? "bg-pink-400 dark:bg-pink-200" : "bg-cyan-500 dark:bg-cyan-200"}`}
            style={{ left: `${left}%`, animationDelay: `${-i * 2.3}s`, animationDuration: `${11 + i * 1.7}s` }}
          />
        ))}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] xl:gap-14"
      >
        <div className="max-w-xl">
          <motion.div
            variants={item}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-600/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium tracking-wide text-cyan-800 dark:border-cyan-300/15 dark:bg-cyan-300/[0.07] dark:text-cyan-100/90"
          >
            <span className="signal-lobby__pulse h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-300" />
            YOUR SPACE TO CONNECT
          </motion.div>

          <motion.h2 variants={item} className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
            Good chats.
            <br />
            <span className="signal-lobby__shimmer bg-gradient-to-r from-cyan-600 via-blue-600 to-pink-500 bg-clip-text text-transparent dark:from-cyan-200 dark:via-blue-300 dark:to-pink-300">
              Better vibes.
            </span>
          </motion.h2>

          <motion.p variants={item} className="mt-5 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300/75 sm:text-base sm:leading-7">
            Your people are one message away. Start a conversation, bring everyone together, and keep the good stuff going.
          </motion.p>

          <motion.div variants={item} className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/squad/explore"
              className="signal-lobby__cta group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_8px_30px_rgba(34,211,238,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(34,211,238,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:from-cyan-300 dark:to-blue-400 dark:focus-visible:ring-cyan-200 dark:focus-visible:ring-offset-[#080b18]"
            >
              <MessageCircle size={17} />
              Find someone to message
              <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/signal/create-group"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-4 py-3 text-sm font-medium text-slate-800 backdrop-blur transition hover:-translate-y-0.5 hover:border-pink-400/50 hover:bg-pink-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.045] dark:text-white/85 dark:hover:border-pink-300/30 dark:hover:bg-pink-300/[0.08] dark:focus-visible:ring-pink-200 dark:focus-visible:ring-offset-[#080b18]"
            >
              <Users size={16} className="text-pink-500 dark:text-pink-200" />
              Create a group
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400/80">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-cyan-600 dark:text-cyan-200/80" /> Private conversations
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap size={13} className="text-pink-500 dark:text-pink-200/80" /> Fast, easy messaging
            </span>
          </motion.div>
        </div>

        <motion.div variants={item} className="relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end">
          <div aria-hidden="true" className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-cyan-400/25 via-blue-500/15 to-pink-400/25 blur-3xl dark:from-cyan-400/15 dark:via-blue-500/10 dark:to-pink-400/20" />
          <div className="signal-lobby__card relative overflow-hidden rounded-3xl border border-slate-900/10 bg-white/70 p-5 shadow-[0_24px_70px_rgba(30,64,175,0.14)] backdrop-blur-xl dark:border-white/[0.11] dark:bg-slate-950/65 dark:shadow-[0_24px_90px_rgba(0,0,0,0.42)] sm:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent dark:via-cyan-200/60" />
            <div aria-hidden="true" className="signal-lobby__sheen pointer-events-none absolute inset-0" />

            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-700/80 dark:text-cyan-100/60">Signal</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white/90">A little more connected</p>
              </div>
              <div className="signal-lobby__spark flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-400/25 bg-gradient-to-br from-cyan-300/25 to-pink-300/25 text-cyan-700 dark:border-pink-200/15 dark:from-cyan-300/15 dark:to-pink-300/15 dark:text-cyan-100">
                <Sparkles size={18} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="signal-lobby__msg flex items-start gap-3" style={{ animationDelay: "0.12s" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-cyan-200 text-xs font-bold text-slate-900">A</div>
                <div className="rounded-2xl rounded-tl-md border border-slate-900/5 bg-slate-900/[0.05] px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.055]">
                  <p className="text-sm text-slate-800 dark:text-white/90">Movie night this weekend?</p>
                  <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400/70">just now</p>
                </div>
              </div>
              <div className="signal-lobby__msg signal-lobby__msg--right flex items-start justify-end gap-3" style={{ animationDelay: "0.4s" }}>
                <div className="rounded-2xl rounded-tr-md border border-pink-400/20 bg-gradient-to-br from-blue-400/25 to-pink-400/20 px-4 py-3 dark:border-pink-200/10 dark:from-blue-400/20 dark:to-pink-400/15">
                  <p className="text-sm text-slate-800 dark:text-white/90">Already picking the snacks ✨</p>
                  <p className="mt-1.5 text-right text-[10px] text-cyan-700/80 dark:text-cyan-100/55">delivered</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-violet-300 text-xs font-bold text-slate-900">Y</div>
              </div>
              <div className="signal-lobby__msg flex items-center gap-3 pl-12" style={{ animationDelay: "0.75s" }} aria-label="Alex is typing">
                <div className="flex items-center gap-1 rounded-full border border-cyan-600/15 bg-cyan-500/10 px-3.5 py-2.5 dark:border-cyan-200/10 dark:bg-cyan-200/[0.06]">
                  {[1, 2, 3].map((dot) => (
                    <span key={dot} className={`signal-lobby__typing-dot signal-lobby__typing-dot--${dot}`} />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400/70">Alex is typing</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-900/5 bg-slate-900/[0.04] px-4 py-3 text-xs text-slate-500 dark:border-white/[0.07] dark:bg-black/20 dark:text-slate-400/70">
              <span className="signal-lobby__pulse--pink h-2 w-2 rounded-full bg-pink-400 dark:bg-pink-300" />
              Your next favorite conversation starts here
            </div>
          </div>
          <div aria-hidden="true" className="signal-lobby__float absolute -right-3 -top-3 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_16px_4px_rgba(34,211,238,0.45)] dark:bg-cyan-200" />
          <div aria-hidden="true" className="signal-lobby__float signal-lobby__float--alt absolute -bottom-4 left-12 h-1.5 w-1.5 rounded-full bg-pink-400 shadow-[0_0_14px_4px_rgba(244,114,182,0.45)] dark:bg-pink-200" />
        </motion.div>
      </motion.div>

      <style>{`
        .signal-lobby__stars {
          opacity: .32;
          background-image: radial-gradient(circle, rgba(186,230,253,.72) .7px, transparent .9px), radial-gradient(circle, rgba(249,168,212,.55) .7px, transparent .9px);
          background-position: 0 0, 20px 24px;
          background-size: 40px 40px;
          mask-image: linear-gradient(90deg, transparent, black 25%, black 85%, transparent);
          animation: signal-twinkle 6s ease-in-out infinite alternate;
        }
        .signal-lobby__aurora {
          background-size: 150% 150%;
          filter: blur(34px);
          will-change: transform;
          animation: signal-aurora-drift 16s ease-in-out infinite alternate;
        }
        .signal-lobby__aurora--dark {
          opacity: .32;
          background:
            radial-gradient(ellipse 55% 38% at 12% 26%, rgba(34,211,238,.38), transparent 72%),
            radial-gradient(ellipse 48% 34% at 68% 14%, rgba(99,102,241,.3), transparent 72%),
            radial-gradient(ellipse 54% 42% at 84% 78%, rgba(236,72,153,.29), transparent 72%);
        }
        .signal-lobby__aurora--light {
          opacity: .55;
          background:
            radial-gradient(ellipse 55% 38% at 12% 26%, rgba(56,189,248,.35), transparent 72%),
            radial-gradient(ellipse 48% 34% at 68% 14%, rgba(129,140,248,.25), transparent 72%),
            radial-gradient(ellipse 54% 42% at 84% 78%, rgba(244,114,182,.28), transparent 72%);
        }
        .signal-lobby__fog {
          width: 24rem; height: 24rem; border-radius: 9999px;
          filter: blur(80px);
          will-change: transform;
          animation: signal-fog-drift 18s ease-in-out infinite alternate;
        }
        .signal-lobby__fog--alt { animation-delay: -9s; animation-duration: 22s; }
        .signal-lobby__fog--mid { width: 18rem; height: 18rem; animation-duration: 26s; animation-delay: -4s; }
        .signal-lobby__mist {
          height: 9rem;
          background: linear-gradient(90deg, transparent 0%, rgba(var(--mist), .22) 30%, rgba(var(--mist), .12) 60%, transparent 100%);
          filter: blur(28px);
          width: 200%;
          will-change: transform;
          animation: signal-mist-slide 34s linear infinite;
        }
        .signal-lobby__mist--2 {
          height: 7rem;
          animation-duration: 46s;
          animation-direction: reverse;
          background: linear-gradient(90deg, transparent 0%, rgba(244,114,182,.16) 35%, rgba(var(--mist), .12) 65%, transparent 100%);
        }
        .signal-lobby__mote {
          position: absolute; bottom: -10px;
          width: 4px; height: 4px; border-radius: 9999px;
          opacity: 0;
          box-shadow: 0 0 10px 2px currentColor;
          animation: signal-mote-rise 14s ease-in infinite;
        }
        .signal-lobby__pulse { animation: signal-pulse 2s ease-in-out infinite; box-shadow: 0 0 10px 2px rgba(34,211,238,.6); }
        .signal-lobby__pulse--pink { animation: signal-pulse 2.4s ease-in-out infinite; box-shadow: 0 0 12px rgba(244,114,182,.65); }
        .signal-lobby__shimmer { background-size: 200% 100%; animation: signal-shimmer 6s ease-in-out infinite alternate; }
        .signal-lobby__cta::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%);
          transform: translateX(-120%);
          animation: signal-cta-sheen 4.5s ease-in-out 1.2s infinite;
          pointer-events: none;
        }
        .signal-lobby__card { animation: signal-card-float 7s ease-in-out infinite; will-change: transform; }
        .signal-lobby__sheen {
          background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,.14) 50%, transparent 60%);
          transform: translateX(-100%);
          animation: signal-card-sheen 7s ease-in-out 1.5s infinite;
        }
        .signal-lobby__spark { animation: signal-spark 3.2s ease-in-out infinite; }
        .signal-lobby__float { animation: signal-float 5s ease-in-out infinite; }
        .signal-lobby__float--alt { animation-duration: 6.5s; animation-delay: -2s; }
        .signal-lobby__msg { opacity: 0; transform: translateY(10px) scale(.96); animation: signal-msg-in .32s cubic-bezier(.2,.9,.3,1.2) forwards; }
        .signal-lobby__msg--right { transform-origin: right bottom; }
        .signal-lobby__typing-dot {
          width: 6px; height: 6px; border-radius: 9999px;
          background: rgb(6,182,212);
          animation: signal-dot-bounce 1s ease-in-out infinite;
        }
        .dark .signal-lobby__typing-dot { background: rgba(165,243,252,.85); }
        .signal-lobby__typing-dot--2 { animation-delay: .15s; }
        .signal-lobby__typing-dot--3 { animation-delay: .3s; }

        @keyframes signal-twinkle { from { opacity: .22; } to { opacity: .4; } }
        @keyframes signal-aurora-drift {
          0% { transform: translate3d(-2%, -1%, 0) scale(.96); }
          100% { transform: translate3d(2%, 2%, 0) scale(1.05); }
        }
        @keyframes signal-fog-drift { to { transform: translate3d(40px, 24px, 0) scale(1.1); } }
        @keyframes signal-mist-slide {
          from { transform: translate3d(-50%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes signal-mote-rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          15% { opacity: .7; }
          85% { opacity: .5; }
          100% { transform: translate3d(24px, -95vh, 0); opacity: 0; }
        }
        @keyframes signal-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(1.35); } }
        @keyframes signal-shimmer { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
        @keyframes signal-cta-sheen { 0%, 60% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
        @keyframes signal-card-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes signal-card-sheen { 0%, 55% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes signal-spark { 0%, 100% { transform: rotate(0) scale(1); } 50% { transform: rotate(8deg) scale(1.08); } }
        @keyframes signal-float { 0%, 100% { transform: translateY(0); opacity: .8; } 50% { transform: translateY(-10px); opacity: 1; } }
        @keyframes signal-msg-in { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes signal-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: .5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .signal-lobby__stars, .signal-lobby__aurora, .signal-lobby__fog, .signal-lobby__mist,
          .signal-lobby__mote, .signal-lobby__pulse, .signal-lobby__pulse--pink, .signal-lobby__shimmer,
          .signal-lobby__cta::after, .signal-lobby__card, .signal-lobby__sheen, .signal-lobby__spark,
          .signal-lobby__float { animation: none; }
          .signal-lobby__mote { display: none; }
          .signal-lobby__msg { opacity: 1; transform: none; animation: none; }
          .signal-lobby__typing-dot { animation: signal-dot-bounce 1.4s ease-in-out infinite; }
        }
      `}</style>
    </section>
  );
}