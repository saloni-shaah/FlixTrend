"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, UserMinus, UserPlus, Trash2 } from "lucide-react";
import VerifiedBadge from "@/components/verifiedbadge";

// ── Gemini palette ─────────────────────────────────────────────────────────────
const GEM = {
  cyan:   [0,   229, 255] as const,
  purple: [123, 47,  255] as const,
  pink:   [224, 64,  251] as const,
  orange: [255, 109, 0  ] as const,
  yellow: [255, 215, 64 ] as const,
  mint:   [0,   255, 163] as const,
  coral:  [255, 64,  129] as const,
};
const PALETTE = Object.values(GEM);

interface Blob { nx:number; ny:number; rm:number; ci:number; a:number; dx:number; dy:number; st:number }
interface Spark { id:number; a:number; d:number; x:number; y:number; s:number; c:number; o:number; p:number; }

const BLOBS: Blob[] = [
  { nx:0.15, ny:0.15, rm:0.9,  ci:0, a:0.22, dx:90,  dy:80, st:0.37 },
  { nx:0.85, ny:0.70, rm:1.1,  ci:1, a:0.18, dx:100, dy:90, st:0.22 },
  { nx:0.50, ny:0.90, rm:0.75, ci:2, a:0.15, dx:70,  dy:60, st:0.53 },
  { nx:0.25, ny:0.50, rm:0.65, ci:3, a:0.14, dx:60,  dy:50, st:0.19 },
  { nx:0.75, ny:0.25, rm:0.70, ci:4, a:0.13, dx:80,  dy:70, st:0.31 },
  { nx:0.60, ny:0.60, rm:0.55, ci:5, a:0.10, dx:55,  dy:45, st:0.41 },
];

const ARC_SEGMENTS = [
  { color: GEM.cyan,   start: 0,   sweep: 70, ring: "outer" },
  { color: GEM.purple, start: 90,  sweep: 50, ring: "outer" },
  { color: GEM.mint,   start: 180, sweep: 80, ring: "outer" },
  { color: GEM.coral,  start: 270, sweep: 40, ring: "outer" },
  { color: GEM.pink,   start: 0,   sweep: 60, ring: "inner" },
  { color: GEM.yellow, start: 140, sweep: 45, ring: "inner" },
  { color: GEM.orange, start: 260, sweep: 55, ring: "inner" },
];

const FALLBACK_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMwYTA5MTQiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MiIgcj0iNDIiIGZpbGw9IiMxYTY3NmYiLz48cGF0aCBkPSJNMzkgMTg0YzE0LTM4IDQzLTU5IDYxLTU5czQ3IDIxIDYxIDU5IiBmaWxsPSIjMTY1MmE0Ii8+PC9zdmc+";

const SPARKS: Spark[] = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  a: (i * 37) % 360,
  d: 72 + (i % 5) * 12,
  x: (i % 3) * 0.7,
  y: (i % 4) * 0.5,
  s: 0.4 + (i % 6) * 0.12,
  c: i % PALETTE.length,
  o: 0.35 + (i % 4) * 0.12,
  p: (i % 7) * 0.08,
}));

// ── Aurora canvas hook ─────────────────────────────────────────────────────────
function useAurora(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (ts: number) => {
      const t = ts * 0.001;
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      for (const bl of BLOBS) {
        const cx = W * bl.nx + Math.sin(t * bl.st) * bl.dx;
        const cy = H * bl.ny + Math.cos(t * bl.st * 0.8) * bl.dy;
        const r  = Math.max(1, W * bl.rm * (0.9 + 0.1 * Math.sin(t * 0.3)));
        const [cr, cg, cb] = PALETTE[bl.ci % PALETTE.length];
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${bl.a})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }

      // static grain
      ctx.fillStyle = "rgba(255,255,255,0.018)";
      for (let k = 0; k < 180; k++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [canvasRef]);
}

// ── Arc ring canvas hook ───────────────────────────────────────────────────────
function useArcRing(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const draw = (ts: number) => {
      const rot1 = (ts * 0.051) % 360;
      const rot2 = 360 - (ts * 0.033) % 360;
      const S = canvas.width;
      ctx.clearRect(0, 0, S, S);

      for (const seg of ARC_SEGMENTS) {
        const isOuter = seg.ring === "outer";
        const pad = isOuter ? 6 : 22;
        const r   = S / 2 - pad;
        const rot = isOuter ? rot1 : rot2;
        const sa  = (rot + seg.start) * Math.PI / 180;
        const ea  = sa + seg.sweep * Math.PI / 180;
        const [cr, cg, cb] = seg.color;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.82)`;
        ctx.lineWidth   = 1.8;
        ctx.lineCap     = "round";
        ctx.beginPath();
        ctx.arc(S / 2, S / 2, r, sa, ea);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef]);
}

// ── Animated counter ───────────────────────────────────────────────────────────
function AnimatedCount({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const dur = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p    = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return <>{display.toLocaleString("en-IN")}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface UserDetailsProps {
  user: {
    id?: string;
    name: string;
    username: string;
    avatar_url: string;
    bio?: string;
    location?: string;
    dob?: string;
    isPremium?: boolean;
    isFounder?: boolean;
    premiumUntil?: { toDate?: () => Date };
    Follower_Count?: number;
    Following_Count?: number;
    postCount?: number;
    totalLikes?: number;
  };
  chat?: {
    id?: string;
    name?: string;
    description?: string;
    avatar_url?: string;
    members?: string[];
    admins?: string[];
    createdAt?: any;
    groupType?: string;
    accountType?: string;
    isGroup?: boolean;
    memberInfo?: Record<string, {
      name?: string;
      username?: string;
      avatar_url?: string;
    }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onImageClick: (url: string) => void;
  currentUserId?: string;
  onAddMember?: (memberId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onDeleteGroup?: () => void;
  addableUsers?: Array<{ id: string; name?: string; username?: string; avatar_url?: string }>;
}

export default function UserDetails({
  user, chat, isOpen, onClose, onViewProfile, onImageClick, currentUserId, onAddMember, onRemoveMember, onDeleteGroup, addableUsers = [],
}: UserDetailsProps) {
  const bgRef  = useRef<HTMLCanvasElement | null>(null);
  const arcRef = useRef<HTMLCanvasElement | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useAurora(bgRef);
  useArcRing(arcRef);
  const isGroup = !!chat?.isGroup;
  const profileImage = chat?.avatar_url || user.avatar_url || FALLBACK_AVATAR;
  const title = isGroup ? (chat?.name || user.name) : user.name;
  const subtitle = isGroup ? (chat?.groupType || chat?.accountType || "community") : user.username;
  const groupMemberCount = chat?.members?.length ?? 0;
  const followersCount = isGroup ? groupMemberCount : Number(user.Follower_Count ?? 0);
  const followingCount = isGroup ? (chat?.admins?.length ?? 0) : Number(user.Following_Count ?? 0);
  const postsCount = !isGroup ? Number(user.postCount ?? 0) : 0;
  const likesCount = !isGroup ? Number(user.totalLikes ?? 0) : 0;
  const isAdmin = isGroup && !!currentUserId && !!chat?.admins?.includes(currentUserId);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [searchAddTerm, setSearchAddTerm] = useState("");
  const [showRevealFx, setShowRevealFx] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);
  const filteredAddableUsers = addableUsers.filter((u) =>
    `${u.name || ""} ${u.username || ""}`.toLowerCase().includes(searchAddTerm.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setShowRevealFx(false);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      return;
    }
    setShowRevealFx(true);
    setRevealPhase(0);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    const phaseInterval = setInterval(() => setRevealPhase(p => (p + 1) % 6), 850);
    revealTimerRef.current = setTimeout(() => {
      setShowRevealFx(false);
      clearInterval(phaseInterval);
    }, 5000);
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      clearInterval(phaseInterval);
    };
  }, [isOpen, user.id, chat?.id]);

  const metaItems = [
    !isGroup && user.location && { icon: "📍", value: user.location },
    !isGroup && user.dob && { icon: "🎂", value: user.dob },
    isGroup && chat?.createdAt && {
      icon: "🗓️",
      value: chat.createdAt?.toDate?.()?.toLocaleDateString?.() || "Recently created",
    },
  ].filter(Boolean) as { icon: string; value: string }[];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/88"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
            style={{ maxHeight: "88dvh" }}
            initial={{ y: "100%", scale: 1.04 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <div
              className="relative flex flex-col overflow-hidden"
              style={{
                borderRadius: "36px 36px 0 0",
                background: "linear-gradient(160deg,#0d0f1e 0%,#070910 100%)",
                boxShadow: "0 -4px 80px rgba(0,229,255,0.06),0 0 0 0.5px rgba(255,255,255,0.07)",
                maxHeight: "88dvh",
              }}
            >
              {/* Aurora background */}
              <canvas
                ref={bgRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
              />

              {/* Drag handle */}
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-full"
                style={{ width: 36, height: 4, background: "rgba(255,255,255,0.18)" }}
              />

              {/* Scrollable body */}
              <div
                className="relative z-10 overflow-y-auto flex-1 pb-32 px-6 pt-12"
                style={{ scrollbarWidth: "none" }}
              >
                {/* ── Avatar ──────────────────────────────────────────────── */}
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  {/* Spotlight */}
                  <motion.div
                    className="absolute inset-[-40px] rounded-full"
                    style={{
                      background: "radial-gradient(circle,rgba(0,229,255,0.18) 0%,rgba(123,47,255,0.09) 50%,transparent 75%)",
                    }}
                    animate={{ scale: [0.95, 1.05], opacity: [0.7, 1] }}
                    transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                  />

                  {showRevealFx && (
                    <>
                      <motion.div
                        className="absolute inset-[-60px] rounded-full pointer-events-none"
                        animate={{
                          opacity: [0.2, 0.6, 0.25, 0.55],
                          scale: [0.96, 1.06, 0.99, 1.03],
                        }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,229,255,0.08) 30%, transparent 70%)",
                          filter: "blur(18px)",
                        }}
                      />
                      <motion.div
                        className="absolute inset-[-26px] rounded-full pointer-events-none"
                        style={{
                          background: `conic-gradient(from ${revealPhase * 60}deg, rgba(0,229,255,0.0), rgba(0,229,255,0.68), rgba(255,109,0,0.0), rgba(224,64,251,0.78), rgba(0,255,163,0.0), rgba(255,215,64,0.72), rgba(0,229,255,0.0))`,
                          filter: "blur(12px)",
                        }}
                        animate={{ rotate: 360, scale: [1, 1.05, 0.98, 1.02] }}
                        transition={{ duration: 4.8, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-[-14px] rounded-full border border-white/10 pointer-events-none"
                        animate={{
                          rotate: -360,
                          opacity: [0.3, 0.7, 0.35],
                          scale: [0.98, 1.02, 0.99],
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                        style={{
                          background: "radial-gradient(circle, transparent 64%, rgba(255,255,255,0.03) 66%, transparent 69%)",
                        }}
                      />
                      <motion.div
                        className="absolute inset-[-18px] rounded-full pointer-events-none"
                        style={{
                          background: "conic-gradient(from 0deg, rgba(0,229,255,0.0), rgba(0,229,255,0.7), rgba(224,64,251,0.0), rgba(255,215,64,0.75), rgba(0,255,163,0.0))",
                          filter: "blur(10px)",
                        }}
                        animate={{ rotate: 360, scale: [0.98, 1.04, 0.98] }}
                        transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-[-10px] rounded-full border border-white/10 pointer-events-none"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        style={{
                          background: "radial-gradient(circle, transparent 68%, rgba(255,255,255,0.04) 69%, transparent 72%)",
                        }}
                      />
                      {Array.from({ length: 12 }).map((_, i) => {
                        const color = PALETTE[i % PALETTE.length];
                        const angle = i * 30;
                        const radius = i % 2 === 0 ? 96 : 86;
                        const [r, g, b] = color;
                        return (
                          <motion.span
                            key={i}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              width: i % 3 === 0 ? 7 : 5,
                              height: i % 3 === 0 ? 7 : 5,
                              left: "50%",
                              top: "50%",
                              marginLeft: -3,
                              marginTop: -3,
                              background: `rgba(${r},${g},${b},0.9)`,
                              boxShadow: `0 0 14px rgba(${r},${g},${b},0.65)`,
                            }}
                            animate={{
                              x: [0, Math.cos((angle + 90) * Math.PI / 180) * radius],
                              y: [0, Math.sin((angle + 90) * Math.PI / 180) * radius],
                              opacity: [0, 1, 0.75, 0],
                              scale: [0.4, 1, 0.75, 0.45],
                            }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.08,
                            }}
                          />
                        );
                      })}
                      {SPARKS.map((spark) => {
                        const [r, g, b] = PALETTE[spark.c];
                        const angle = (spark.a + revealPhase * 28) * Math.PI / 180;
                        const baseX = Math.cos(angle) * spark.d;
                        const baseY = Math.sin(angle) * spark.d;
                        return (
                          <motion.span
                            key={spark.id}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              left: "50%",
                              top: "50%",
                              marginLeft: -2,
                              marginTop: -2,
                              width: spark.id % 4 === 0 ? 8 : 5,
                              height: spark.id % 4 === 0 ? 8 : 5,
                              background: `rgba(${r},${g},${b},${spark.o})`,
                              boxShadow: `0 0 16px rgba(${r},${g},${b},0.8)`,
                            }}
                            animate={{
                              x: [0, baseX * 0.4, baseX, baseX * 0.7],
                              y: [0, baseY * 0.4, baseY, baseY * 0.7],
                              opacity: [0, 1, 0.85, 0],
                              scale: [0.35, 1, 0.7, 0.45],
                            }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: spark.p,
                            }}
                          />
                        );
                      })}
                      {Array.from({ length: 8 }).map((_, i) => {
                        const [r, g, b] = PALETTE[(i + revealPhase) % PALETTE.length];
                        const spin = i % 2 === 0 ? 1 : -1;
                        return (
                          <motion.div
                            key={`trail-${i}`}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              left: "50%",
                              top: "50%",
                              width: 2,
                              height: 40 + i * 6,
                              marginLeft: -1,
                              marginTop: -(20 + i * 3),
                              background: `linear-gradient(to top, rgba(${r},${g},${b},0), rgba(${r},${g},${b},0.8), rgba(${r},${g},${b},0))`,
                              opacity: 0.7,
                              filter: "blur(1px)",
                            }}
                            animate={{
                              rotate: [0, spin * 18, spin * -12, 0],
                              scaleY: [0.6, 1, 0.8, 0.65],
                              opacity: [0.25, 0.75, 0.35],
                            }}
                            transition={{
                              duration: 3.2 + i * 0.18,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.05,
                            }}
                          />
                        );
                      })}
                    </>
                  )}

                  {/* Arc ring */}
                  <canvas ref={arcRef} width={176} height={176} className="absolute inset-0 w-full h-full pointer-events-none" />

                  {/* Avatar image */}
                  <motion.button
                    onClick={() => onImageClick(profileImage)}
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.05 }}
                    whileHover={{ scale: 1.07 }}
                    className="relative z-10 rounded-full overflow-hidden"
                    style={{
                      width: 108, height: 108,
                      border: showRevealFx ? "2px solid rgba(255,255,255,0.3)" : "2px solid rgba(255,255,255,0.18)",
                      boxShadow: showRevealFx
                        ? "0 0 0 8px rgba(0,229,255,0.08), 0 0 42px rgba(224,64,251,0.22), 0 0 68px rgba(255,215,64,0.18)"
                        : "0 0 0 8px rgba(0,229,255,0.06)",
                    }}
                  >
                    <img src={profileImage} alt={title} className="w-full h-full object-cover" />
                  </motion.button>
                </div>

                {/* ── Name + badge ─────────────────────────────────────────── */}
                <motion.div
                  className="flex items-center justify-center gap-2 mt-5"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
                    {title}
                  </span>
                  {!isGroup && (user.isPremium || user.isFounder) && (
                    <VerifiedBadge isVerified size={20} expiredAt={user.premiumUntil?.toDate?.()?.getTime()} />
                  )}
                </motion.div>

                <motion.p
                  className="text-center mt-1"
                  style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 13, color: "rgba(255,255,255,0.42)" }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {isGroup ? `${groupMemberCount} members · ${subtitle}` : `@${subtitle}`}
                </motion.p>

                {/* ── Group/community pill ───────────────────────────────── */}
                {isGroup ? (
                  <motion.div
                    className="flex justify-center mt-3"
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CommunityPill />
                  </motion.div>
                ) : (
                  user.isFounder && (
                    <motion.div
                      className="flex justify-center mt-3"
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <FounderPill />
                    </motion.div>
                  )
                )}

                {/* ── Bio ──────────────────────────────────────────────────── */}
                {isGroup ? (
                  chat?.description?.trim() && (
                    <motion.p
                      className="mt-5 text-center px-2"
                      style={{ fontFamily: "'Lora', serif", fontSize: 14, lineHeight: 1.72, color: "rgba(255,255,255,0.72)" }}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 }}
                    >
                      {chat.description}
                    </motion.p>
                  )
                ) : (
                  user.bio?.trim() && (
                    <motion.p
                      className="mt-5 text-center px-2"
                      style={{ fontFamily: "'Lora', serif", fontSize: 14, lineHeight: 1.72, color: "rgba(255,255,255,0.72)" }}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 }}
                    >
                      {user.bio}
                    </motion.p>
                  )
                )}

                {isGroup && (
                  <motion.p
                    className="mt-4 text-center px-2"
                    style={{ fontFamily: "'Lora', serif", fontSize: 13, lineHeight: 1.72, color: "rgba(255,255,255,0.5)" }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
                  >
                    Community chats use the same people-centric Signal space, with a shared space for updates, drops, and coordination.
                  </motion.p>
                )}

                {/* ── Meta ─────────────────────────────────────────────────── */}
                {metaItems.length > 0 && (
                  <motion.div
                    className="flex items-center justify-center gap-5 mt-4"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                  >
                    {metaItems.map(({ icon, value }) => (
                      <div key={value} className="flex items-center gap-1.5">
                        <span style={{ fontSize: 13 }}>{icon}</span>
                        <span style={{ fontFamily: "'Lora', serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* ── Divider ──────────────────────────────────────────────── */}
                <div
                  className="my-5 mx-4"
                  style={{ height: "0.5px", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }}
                />

                {/* ── Stats card ───────────────────────────────────────────── */}
                <motion.div
                  className="mx-4 rounded-3xl flex"
                  style={{
                    padding: "20px 0",
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                  }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <StatItem label={isGroup ? "MEMBERS" : "FOLLOWERS"} count={followersCount} />
                  <div style={{ width: "0.5px", height: 32, background: "rgba(255,255,255,0.12)", alignSelf: "center" }} />
                  <StatItem label={isGroup ? "ADMINS" : "FOLLOWING"} count={followingCount} />
                </motion.div>

                {isGroup && (
                  <motion.div
                    className="mx-4 mt-4 rounded-3xl p-4 border border-white/10 bg-white/[0.03]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-accent-cyan" />
                        <span className="text-xs font-bold tracking-[0.18em] text-white/50">MEMBERS</span>
                      </div>
                      {isAdmin && onAddMember && (
                        <button onClick={() => { setSearchAddTerm(""); setShowAddPicker(true); }} className="text-xs font-bold text-accent-cyan flex items-center gap-1">
                          <UserPlus size={14} /> Add
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {chat?.members?.length ? chat.members.map((memberId) => {
                        const member = chat.memberInfo?.[memberId];
                        const memberName = member?.name || member?.username || memberId;
                        const memberUsername = member?.username || memberId;
                        const isGroupAdmin = !!chat.admins?.includes(memberId);
                        const canRemove = isAdmin && memberId !== currentUserId;
                        return (
                          <div key={memberId} className="flex items-center gap-3 rounded-2xl bg-black/25 px-3 py-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                              {member?.avatar_url ? (
                                <img src={member.avatar_url} alt={memberName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-white/70">{memberName?.[0]?.toUpperCase() || "U"}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm font-semibold truncate">{memberName}</p>
                                {isGroupAdmin && <Shield size={13} className="text-yellow-400" />}
                              </div>
                              <p className="text-[11px] text-white/45 truncate">@{memberUsername}</p>
                            </div>
                            {canRemove && onRemoveMember && (
                              <button onClick={() => onRemoveMember(memberId)} className="p-2 rounded-full hover:bg-red-500/15 text-red-300">
                                <UserMinus size={14} />
                              </button>
                            )}
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-white/40">No members found.</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {isGroup && isAdmin && (
                  <motion.div
                    className="mx-4 mt-4 rounded-3xl p-4 border border-red-500/20 bg-red-500/5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-red-200">Admin actions</p>
                        <p className="text-xs text-red-200/60">Manage members or delete this group.</p>
                      </div>
                      {onDeleteGroup && (
                        <button onClick={onDeleteGroup} className="px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center gap-2">
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {showAddPicker && isAdmin && onAddMember && (
                    <>
                      <motion.div
                        className="fixed inset-0 z-[60] bg-black/70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddPicker(false)}
                      />
                      <motion.div
                        className="fixed left-4 right-4 top-20 z-[61] mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#0b0d16] p-4 shadow-2xl"
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-bold">Add members</p>
                            <p className="text-xs text-white/40">Pick from your connections</p>
                          </div>
                          <button onClick={() => setShowAddPicker(false)} className="text-white/50">✕</button>
                        </div>
                        <input
                          value={searchAddTerm}
                          onChange={(e) => setSearchAddTerm(e.target.value)}
                          placeholder="Search people..."
                          className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none mb-3"
                        />
                        <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-2 pr-1">
                          {filteredAddableUsers.length > 0 ? filteredAddableUsers.map((member) => {
                            const alreadyAdded = chat?.members?.includes(member.id);
                            return (
                              <button
                                key={member.id}
                                disabled={alreadyAdded}
                                onClick={() => {
                                  onAddMember(member.id);
                                  setShowAddPicker(false);
                                }}
                                className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors ${alreadyAdded ? "bg-white/5 opacity-50" : "hover:bg-white/10 bg-white/[0.03]"}`}
                              >
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                                  {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.name || member.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-white/70">{member.name?.[0]?.toUpperCase() || "U"}</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold truncate">{member.name || member.username}</p>
                                  <p className="text-[11px] text-white/45 truncate">@{member.username}</p>
                                </div>
                                {alreadyAdded && <span className="text-[11px] text-white/40">Added</span>}
                              </button>
                            );
                          }) : (
                            <p className="text-sm text-white/40 py-6 text-center">No matching connections.</p>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* ── Extra tags ───────────────────────────────────────────── */}
                <motion.div
                  className="flex gap-2 justify-center flex-wrap mt-4"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isGroup ? (
                    <>
                      <ExtraTag color={GEM.purple} label={chat?.groupType || "Community"} />
                      <ExtraTag color={GEM.pink} label={`${groupMemberCount} Members`} />
                    </>
                  ) : (
                    <>
                      <ExtraTag color={GEM.purple} label={`${postsCount} Posts`} />
                      <ExtraTag color={GEM.pink}   label={`${likesCount.toLocaleString("en-IN")} Likes`} />
                    </>
                  )}
                </motion.div>
              </div>

              {/* ── Pinned CTA ───────────────────────────────────────────────── */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-5 z-20"
                style={{ background: "linear-gradient(to top,rgba(6,8,18,0.98) 70%,transparent)" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <ShimmerButton onClick={onViewProfile} label={isGroup ? "Open Group Chat" : "View Full Profile"} />
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatItem({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
        <AnimatedCount target={count} />
      </span>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: "1.8px" }}>
        {label}
      </span>
    </div>
  );
}

function ExtraTag({ color, label }: { color: readonly [number,number,number]; label: string }) {
  const [r, g, b] = color;
  return (
    <span
      style={{
        padding: "5px 14px", borderRadius: 50,
        background: `rgba(${r},${g},${b},0.12)`,
        border: `0.5px solid rgba(${r},${g},${b},0.28)`,
        color: `rgba(${r},${g},${b},1)`,
        fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px",
      }}
    >
      {label}
    </span>
  );
}

function FounderPill() {
  return (
    <motion.div
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 14px", borderRadius: 50,
        background: "linear-gradient(90deg,rgba(0,229,255,0.12),rgba(0,255,163,0.08))",
        fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 800,
        color: "rgba(0,229,255,1)", letterSpacing: "2.5px",
        border: "0.8px solid rgba(0,229,255,0.3)",
      }}
      animate={{ borderColor: ["rgba(0,229,255,0.18)", "rgba(0,229,255,0.5)"] }}
      transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse" }}
    >
      FOUNDER
    </motion.div>
  );
}

function CommunityPill() {
  return (
    <motion.div
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 14px", borderRadius: 50,
        background: "linear-gradient(90deg,rgba(255,109,0,0.12),rgba(255,215,64,0.08))",
        fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 800,
        color: "rgba(255,215,64,1)", letterSpacing: "2.5px",
        border: "0.8px solid rgba(255,215,64,0.3)",
      }}
    >
      COMMUNITY
    </motion.div>
  );
}

function ShimmerButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-full overflow-hidden"
      style={{
        height: 58, borderRadius: 20, border: "none", cursor: "pointer",
        background: "#fff", fontFamily: "'Syne', sans-serif",
        fontSize: 15, fontWeight: 800, color: "#000",
      }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(255,255,255,0.15)" }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg,transparent 30%,rgba(0,229,255,0.18) 50%,transparent 70%)",
        }}
        animate={{ x: ["-100%", "300%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 1.2 }}
      />
      {label}
    </motion.button>
  );
}
