"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Zap } from "lucide-react";

export function ChatLobby() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const dots = Array.from({ length: 55 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.4 + 0.15,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > c.width) d.vx *= -1;
        if (d.y < 0 || d.y > c.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,140,255,${d.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleBurst = () => { setBurst(true); setTimeout(() => setBurst(false), 600); };

  return (
    <div className="relative h-full flex items-center justify-center px-6 overflow-hidden bg-[hsl(240_6%_10%)]">
      {/* dot canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* ambient blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent-purple/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-16 w-60 h-60 rounded-full bg-accent-cyan/15 blur-3xl animate-pulse [animation-delay:1.2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 rounded-full bg-accent-pink/10 blur-3xl" />

      {/* card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-sm"
      >
        {/* icon pod */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
          className="mb-7 flex justify-center"
        >
          <div className="relative p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <MessageSquare size={42} strokeWidth={1.4} className="text-white" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent-cyan shadow-[0_0_6px_2px] shadow-accent-cyan/50 animate-pulse" />
          </div>
        </motion.div>

        {/* heading */}
        <h2 className="text-[1.75rem] font-bold tracking-tight text-white mb-2.5 leading-tight">
          your convos,{" "}
          <span
            className="bg-gradient-to-r from-accent-pink via-accent-purple to-accent-cyan bg-clip-text text-transparent"
            style={{ backgroundSize: "200% auto", animation: "shimmer 3s linear infinite" }}
          >
            no cap ✨
          </span>
        </h2>

        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          slide in, pick a chat, and get bussin — fast, private, fr fr 💬
        </p>

        {/* burst button */}
        <div className="relative flex justify-center">
          <AnimatePresence>
            {burst && Array.from({ length: 8 }).map((_, i) => (
              <motion.span key={i}
                className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                style={{ background: i % 2 === 0 ? "#FF6B6B" : "#00F0FF" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 48, y: Math.sin((i / 8) * Math.PI * 2) * 48, opacity: 0, scale: 0 }}
                exit={{}}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleBurst}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #FF6B6B, #7D5FFF, #00F0FF)", backgroundSize: "200% 200%", animation: "gradMove 4s ease infinite" }}
          >
            <Zap size={15} /> start a new chat
          </motion.button>
        </div>

        {/* footer */}
        <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-gray-500 tracking-wide">
          <Sparkles size={11} /> fast · private · flixtrend signal
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer { to { background-position: 200% center; } }
        @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>
    </div>
  );
}