'use client';

import React, { useState } from 'react';

const CSS_KEYFRAMES = `
  @keyframes badge-shimmer {
    0%   { transform: translateX(-180%) skewX(-18deg); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translateX(280%) skewX(-18deg); opacity: 0; }
  }
  @keyframes badge-crown-aura {
    0%, 100% {
      box-shadow: 0 0 12px 4px rgba(255,215,0,0.65), 0 0 40px 10px rgba(255,215,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 10px rgba(0,0,0,0.55);
    }
    50% {
      box-shadow: 0 0 22px 7px rgba(255,215,0,0.9), 0 0 65px 18px rgba(255,165,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 10px rgba(0,0,0,0.55);
    }
  }
  @keyframes badge-silver-aura {
    0%, 100% {
      box-shadow: 0 0 10px 3px rgba(200,210,220,0.55), 0 0 30px 8px rgba(192,192,192,0.2),
        inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 10px rgba(0,0,0,0.55);
    }
    50% {
      box-shadow: 0 0 18px 5px rgba(220,230,240,0.75), 0 0 50px 12px rgba(192,192,192,0.3),
        inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 10px rgba(0,0,0,0.55);
    }
  }
  @keyframes badge-ember-aura {
    0%, 100% {
      box-shadow: 0 0 10px 3px rgba(255,80,0,0.6), 0 0 28px 7px rgba(255,69,0,0.22),
        inset 0 1px 0 rgba(255,200,100,0.2), 0 2px 10px rgba(0,0,0,0.55);
    }
    50% {
      box-shadow: 0 0 20px 6px rgba(255,120,0,0.85), 0 0 50px 14px rgba(255,69,0,0.38),
        inset 0 1px 0 rgba(255,200,100,0.3), 0 2px 10px rgba(0,0,0,0.55);
    }
  }
  @keyframes badge-cyan-aura {
    0%, 100% {
      box-shadow: 0 0 9px 3px rgba(0,191,255,0.55), 0 0 26px 7px rgba(0,191,255,0.18),
        inset 0 1px 0 rgba(150,240,255,0.2), 0 2px 10px rgba(0,0,0,0.55);
    }
    50% {
      box-shadow: 0 0 17px 5px rgba(0,210,255,0.75), 0 0 45px 12px rgba(0,191,255,0.3),
        inset 0 1px 0 rgba(150,240,255,0.3), 0 2px 10px rgba(0,0,0,0.55);
    }
  }
  @keyframes badge-pink-aura {
    0%, 100% {
      box-shadow: 0 0 9px 3px rgba(255,20,147,0.5), 0 0 24px 6px rgba(255,20,147,0.18),
        inset 0 1px 0 rgba(255,180,220,0.2), 0 2px 10px rgba(0,0,0,0.55);
    }
    50% {
      box-shadow: 0 0 17px 5px rgba(255,20,147,0.7), 0 0 42px 11px rgba(255,20,147,0.28),
        inset 0 1px 0 rgba(255,180,220,0.3), 0 2px 10px rgba(0,0,0,0.55);
    }
  }
  @keyframes badge-purple-aura {
    0%, 100% {
      box-shadow: 0 0 9px 3px rgba(138,43,226,0.55), 0 0 24px 6px rgba(138,43,226,0.2),
        inset 0 1px 0 rgba(200,150,255,0.2), 0 2px 10px rgba(0,0,0,0.55);
    }
    50% {
      box-shadow: 0 0 17px 5px rgba(180,80,255,0.75), 0 0 42px 11px rgba(138,43,226,0.32),
        inset 0 1px 0 rgba(200,150,255,0.3), 0 2px 10px rgba(0,0,0,0.55);
    }
  }
`;

function BadgeStyleProvider() {
  React.useEffect(() => {
    const id = 'flixtrend-badge-keyframes';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = CSS_KEYFRAMES;
    document.head.appendChild(el);
  }, []);
  return null;
}

type Tier = 'crown' | 'legend' | 'elite' | 'apex' | 'prime' | 'high' | 'mid' | 'low' | 'entry';

interface BadgeDef {
  label: string;
  symbol: string;
  tier: Tier;
  gradient: string;
  textColor: string;
  shimmer: boolean;
  shimmerColor: string;
  auraAnim: string | null; // null = no animation
}

// ── Top 10 get full animation. Rest: static. ──────────────────────────────────
const BADGES: Record<string, BadgeDef> = {
  vibestarter: {
    label: 'Vibe Starter', symbol: '▶', tier: 'mid',
    gradient: 'linear-gradient(135deg, #C0006A 0%, #FF1493 45%, #FF75B8 55%, #FF1493 75%, #C0006A 100%)',
    textColor: '#fff', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },

  // ── LEADERBOARD ───────────────────────────────────────────────────────────
  top_1_follower: {                                                       // animated #1
    label: '#1 Crown', symbol: '👑', tier: 'crown',
    gradient: 'linear-gradient(135deg, #7A5500 0%, #C8900A 18%, #FFD700 35%, #FFF6B0 50%, #FFD700 65%, #C8900A 82%, #7A5500 100%)',
    textColor: '#3A1F00', shimmer: true, shimmerColor: 'rgba(255,255,220,0.65)',
    auraAnim: 'badge-crown-aura 2s ease-in-out infinite',
  },
  top_2_follower: {                                                       // animated #2
    label: '#2 Elite', symbol: '🛡', tier: 'elite',
    gradient: 'linear-gradient(135deg, #4A5560 0%, #8090A0 18%, #B8C4CC 35%, #E4EAEE 50%, #B8C4CC 65%, #8090A0 82%, #4A5560 100%)',
    textColor: '#1A2530', shimmer: true, shimmerColor: 'rgba(255,255,255,0.55)',
    auraAnim: 'badge-silver-aura 2.5s ease-in-out infinite',
  },
  top_3_follower: {                                                       // animated #3
    label: '#3 Apex', symbol: '🏆', tier: 'apex',
    gradient: 'linear-gradient(135deg, #451200 0%, #8B4010 18%, #C87020 35%, #E8A040 50%, #C87020 65%, #8B4010 82%, #451200 100%)',
    textColor: '#FFF2E0', shimmer: true, shimmerColor: 'rgba(255,230,160,0.5)',
    auraAnim: 'badge-ember-aura 2.2s ease-in-out infinite',
  },
  top_4_follower: {                                                       // animated #4
    label: '#4 Prime', symbol: '💎', tier: 'prime',
    gradient: 'linear-gradient(135deg, #002A48 0%, #005888 18%, #00A8E8 35%, #70DDFF 50%, #00A8E8 65%, #005888 82%, #002A48 100%)',
    textColor: '#fff', shimmer: true, shimmerColor: 'rgba(180,245,255,0.5)',
    auraAnim: 'badge-cyan-aura 2.5s ease-in-out infinite',
  },
  top_5_follower: {                                                       // animated #5
    label: '#5 Rising', symbol: '↑', tier: 'prime',
    gradient: 'linear-gradient(135deg, #530028 0%, #9C0055 18%, #F0006A 35%, #FF80B8 50%, #F0006A 65%, #9C0055 82%, #530028 100%)',
    textColor: '#fff', shimmer: true, shimmerColor: 'rgba(255,200,230,0.4)',
    auraAnim: 'badge-pink-aura 3s ease-in-out infinite',
  },

  // ── FOLLOWER MILESTONES ───────────────────────────────────────────────────
  legend: {                                                               // animated #6
    label: 'Legend', symbol: '🌟', tier: 'legend',
    gradient: 'linear-gradient(135deg, #5C4400 0%, #B88000 18%, #D4A020 35%, #F5CC50 50%, #D4A020 65%, #B88000 82%, #5C4400 100%)',
    textColor: '#2E1800', shimmer: true, shimmerColor: 'rgba(255,255,180,0.55)',
    auraAnim: 'badge-crown-aura 2.8s ease-in-out infinite',
  },
  icon: {                                                                 // animated #7
    label: 'Icon', symbol: '⭐', tier: 'high',
    gradient: 'linear-gradient(135deg, #4A3800 0%, #8A6800 25%, #C09020 45%, #DDB840 55%, #C09020 70%, #8A6800 85%, #4A3800 100%)',
    textColor: '#FFF4D0', shimmer: true, shimmerColor: 'rgba(255,240,140,0.4)',
    auraAnim: 'badge-crown-aura 3s ease-in-out infinite',
  },
  force: {                                                                // animated #8
    label: 'Force', symbol: '🔮', tier: 'high',
    gradient: 'linear-gradient(135deg, #220055 0%, #5C08A8 25%, #8E30E8 45%, #B868FF 55%, #8E30E8 70%, #5C08A8 85%, #220055 100%)',
    textColor: '#F0E0FF', shimmer: true, shimmerColor: 'rgba(210,160,255,0.4)',
    auraAnim: 'badge-purple-aura 2s ease-in-out infinite',
  },
  storm: {                                                                // static
    label: 'Storm', symbol: '⚡', tier: 'mid',
    gradient: 'linear-gradient(135deg, #0A0820 0%, #302880 25%, #5448B8 45%, #7A70D8 55%, #5448B8 70%, #302880 85%, #0A0820 100%)',
    textColor: '#D8D4FF', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },
  hype: {                                                                 // static
    label: 'Hype', symbol: '🔥', tier: 'mid',
    gradient: 'linear-gradient(135deg, #660028 0%, #BB0060 25%, #F0006A 45%, #FF60A8 55%, #F0006A 70%, #BB0060 85%, #660028 100%)',
    textColor: '#fff', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },
  wave: {
    label: 'Wave', symbol: '🌊', tier: 'low',
    gradient: 'linear-gradient(135deg, #003855 0%, #0070B0 25%, #00AADD 45%, #50D0F0 55%, #00AADD 70%, #0070B0 85%, #003855 100%)',
    textColor: '#fff', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },
  buzz: {
    label: 'Buzz', symbol: '⚡', tier: 'low',
    gradient: 'linear-gradient(135deg, #553800 0%, #AA7000 25%, #F0B000 45%, #FFDA50 55%, #F0B000 70%, #AA7000 85%, #553800 100%)',
    textColor: '#2E1800', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },
  spark: {
    label: 'Spark', symbol: '✨', tier: 'entry',
    gradient: 'linear-gradient(135deg, #003058 0%, #005898 25%, #3088C8 45%, #70B8E8 55%, #3088C8 70%, #005898 85%, #003058 100%)',
    textColor: '#fff', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },

  // ── LIKES MILESTONES ─────────────────────────────────────────────────────
  phenomenon: {                                                           // animated #9
    label: 'Phenomenon', symbol: '🌋', tier: 'legend',
    gradient: 'linear-gradient(135deg, #500000 0%, #980800 18%, #E83000 35%, #FF7000 50%, #E83000 65%, #980800 82%, #500000 100%)',
    textColor: '#FFE8D0', shimmer: true, shimmerColor: 'rgba(255,200,80,0.5)',
    auraAnim: 'badge-ember-aura 1.6s ease-in-out infinite',
  },
  sensation: {                                                            // animated #10
    label: 'Sensation', symbol: '🔥', tier: 'high',
    gradient: 'linear-gradient(135deg, #450000 0%, #8A1800 18%, #E04000 35%, #FF6030 50%, #E04000 65%, #8A1800 82%, #450000 100%)',
    textColor: '#fff', shimmer: true, shimmerColor: 'rgba(255,170,90,0.4)',
    auraAnim: 'badge-ember-aura 2s ease-in-out infinite',
  },
  viral: {                                                                // static
    label: 'Viral', symbol: '📡', tier: 'mid',
    gradient: 'linear-gradient(135deg, #401200 0%, #801E00 25%, #E85020 45%, #FF7850 55%, #E85020 70%, #801E00 85%, #401200 100%)',
    textColor: '#fff', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },
  adored: {
    label: 'Adored', symbol: '💗', tier: 'low',
    gradient: 'linear-gradient(135deg, #580028 0%, #A00050 25%, #E80070 45%, #FF70A8 55%, #E80070 70%, #A00050 85%, #580028 100%)',
    textColor: '#fff', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },
  liked: {
    label: 'Liked', symbol: '❤', tier: 'entry',
    gradient: 'linear-gradient(135deg, #480020 0%, #880040 25%, #C80060 45%, #FF60A0 55%, #C80060 70%, #880040 85%, #480020 100%)',
    textColor: '#FFD0E8', shimmer: false, shimmerColor: '',
    auraAnim: null,
  },
};

const TIER_SIZE: Record<Tier, { fs: string; px: string; py: string; gap: string; icon: string; fw: number }> = {
  crown:  { fs: '0.82rem', px: '15px', py: '7px',  gap: '7px',  icon: '16px', fw: 800 },
  legend: { fs: '0.78rem', px: '13px', py: '6px',  gap: '6px',  icon: '15px', fw: 800 },
  elite:  { fs: '0.78rem', px: '13px', py: '6px',  gap: '6px',  icon: '15px', fw: 800 },
  apex:   { fs: '0.78rem', px: '13px', py: '6px',  gap: '6px',  icon: '15px', fw: 800 },
  prime:  { fs: '0.75rem', px: '12px', py: '5px',  gap: '6px',  icon: '14px', fw: 700 },
  high:   { fs: '0.72rem', px: '11px', py: '5px',  gap: '5px',  icon: '13px', fw: 700 },
  mid:    { fs: '0.70rem', px: '10px', py: '4px',  gap: '5px',  icon: '12px', fw: 700 },
  low:    { fs: '0.68rem', px: '9px',  py: '4px',  gap: '4px',  icon: '12px', fw: 600 },
  entry:  { fs: '0.65rem', px: '8px',  py: '3px',  gap: '4px',  icon: '11px', fw: 600 },
};

const DISPLAY_LIMIT = 15;

export const AccoladeBadge = ({ type }: { type: string }) => {
  const badge = BADGES[type];
  if (!badge) return null;

  const { label, symbol, tier, gradient, textColor, shimmer, shimmerColor, auraAnim } = badge;
  const sz = TIER_SIZE[tier];
  const isTopTier = tier === 'crown' || tier === 'legend' || tier === 'elite' || tier === 'apex';

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        gap: sz.gap,
        padding: `${sz.py} ${sz.px}`,
        borderRadius: '9999px',
        background: gradient,
        color: textColor,
        fontSize: sz.fs,
        fontWeight: sz.fw,
        fontFamily: "'DM Mono', 'Fira Code', 'SF Mono', monospace",
        letterSpacing: '0.04em',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: auraAnim ? undefined : '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
        animation: auraAnim ?? undefined,
        cursor: 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        textShadow: (tier === 'crown' || tier === 'elite' || tier === 'apex') ? 'none' : '0 1px 3px rgba(0,0,0,0.45)',
        // blur only for top tiers — GPU cost too high on low-end devices otherwise
        backdropFilter: isTopTier ? 'blur(4px)' : undefined,
        WebkitBackdropFilter: isTopTier ? 'blur(4px)' : undefined,
      }}
    >
      {shimmer && (
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, width: '45%',
            background: `linear-gradient(105deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
            animation: 'badge-shimmer 3.5s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 1,
          }}
        />
      )}
      <span style={{ fontSize: sz.icon, lineHeight: 1, position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}>
        {symbol}
      </span>
      <span style={{ position: 'relative', zIndex: 2, lineHeight: 1.2 }}>
        {label}
      </span>
    </div>
  );
};

const SORT_ORDER = [
  'top_1_follower', 'top_2_follower', 'top_3_follower', 'top_4_follower', 'top_5_follower',
  'phenomenon', 'legend',
  'sensation', 'icon', 'force',
  'viral', 'storm', 'hype',
  'adored', 'wave', 'buzz',
  'liked', 'spark',
  'vibestarter',
];

export const SquadBadges = ({ accolades }: { accolades?: string[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (!accolades || accolades.length === 0) return null;

  const sorted = [...accolades].sort((a, b) => {
    const ia = SORT_ORDER.indexOf(a);
    const ib = SORT_ORDER.indexOf(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const total = sorted.length;
  // Show all if ≤15. If >15, show 15 + toggle.
  const visible = (!expanded && total > DISPLAY_LIMIT) ? sorted.slice(0, DISPLAY_LIMIT) : sorted;
  const hidden = total > DISPLAY_LIMIT ? total - DISPLAY_LIMIT : 0;

  return (
    <>
      <BadgeStyleProvider />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 0' }}>
        {visible.map((type) => (
          <AccoladeBadge key={type} type={type} />
        ))}

        {/* "+N more" pill — only shows when there are hidden badges and not yet expanded */}
        {!expanded && hidden > 0 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 10px', borderRadius: '9999px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.65rem', fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            +{hidden} more
          </button>
        )}
      </div>
    </>
  );
};