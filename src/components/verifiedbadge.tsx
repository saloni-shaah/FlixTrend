'use client';

import { useEffect, useRef, useState } from 'react';

type VerifiedBadgeProps = {
  size?: number;
  isVerified?: boolean;
  expiredAt?: number | null;
};

// ─── Context-aware background detector ───────────────────────────────────────
// Walks up the DOM, reads computed background, returns dark or light.
function getParentLuminance(el: HTMLElement | null): 'dark' | 'light' {
  let node = el?.parentElement ?? null;
  for (let i = 0; i < 6 && node; i++) {
    const bg = getComputedStyle(node).backgroundColor;
    const m  = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      if (r + g + b === 0) { node = node.parentElement; continue; } // transparent
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum < 0.45 ? 'dark' : 'light';
    }
    node = node.parentElement;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const VerifiedBadge = ({
  size = 22,
  isVerified = false,
  expiredAt = null,
}: VerifiedBadgeProps) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<'dark' | 'light'>('light');

  const now               = Date.now();
  const isRecentlyExpired =
    expiredAt != null &&
    now - expiredAt > 0 &&
    now - expiredAt <= 30 * 24 * 60 * 60 * 1000;
  const isActive = isVerified;

  useEffect(() => {
    if (!badgeRef.current) return;
    setContext(getParentLuminance(badgeRef.current));
  }, []);

  if (!isActive && !isRecentlyExpired) return null;

  // ── Derived sizes
  const checkSize     = size * 0.52;
  const highlightSize = size * 0.55;
  const tipFontSize   = Math.max(10, Math.round(size * 0.52));

  // ── Context-adaptive values
  const isDark       = context === 'dark';
  const glowAlpha    = isDark ? 0.45 : 0.28;
  const glowSpread   = isDark ? 10 : 6;
  const pulseRadius  = Math.round(size * (isDark ? 0.38 : 0.28));
  const hoverGlowPx  = Math.round(size * 0.22);

  // ── Gradients
  // Active: cyan → electric-blue → indigo. "Light through glass" hue shift.
  const activeGrad  = 'linear-gradient(145deg, #47c1f8 0%, #1a9fe8 35%, #1278d4 70%, #1560c0 100%)';
  // Expired: blue-tinted cool grey. Not dull, not vibrant. "Lost status" matte.
  const expiredGrad = 'linear-gradient(145deg, #aab4bb 0%, #8d9ea7 50%, #798e97 100%)';

  const tooltipLabel = isActive ? 'Verified · Trusted Creator' : 'Previously Verified';

  return (
    <>
      <style id="vb-styles">{`
        /* ── Pulse: 3 runs then stops. Premium apps don't beg for attention. ── */
        @keyframes vb-pulse {
          0%,100% { box-shadow: 0 0 0 0             rgba(29,161,242,${glowAlpha}),  0 2px ${glowSpread}px rgba(29,161,242,0.2); }
          50%     { box-shadow: 0 0 0 ${pulseRadius}px rgba(29,161,242,0),           0 2px ${glowSpread}px rgba(29,161,242,0.2); }
        }
        @keyframes vb-fadein {
          from { opacity:0; transform: scale(0.65) rotate(-4deg); }
          to   { opacity:1; transform: scale(1)    rotate(0deg);  }
        }

        .vb {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: default;
          flex-shrink: 0;
          animation: vb-fadein 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.22s ease,
                      filter     0.22s ease;
        }
        .vb-active {
          animation:
            vb-fadein 0.38s cubic-bezier(0.34,1.56,0.64,1) both,
            vb-pulse  3.2s ease-in-out 0.9s 3;       /* 3× then done */
        }
        /* Hover: scale + 1.5° tilt + boosted glow */
        .vb-active:hover {
          transform: scale(1.13) rotate(1.5deg);
          filter: brightness(1.08);
          box-shadow: 0 0 0 ${hoverGlowPx}px rgba(29,161,242,${glowAlpha * 0.45}),
                      0 4px ${glowSpread + 4}px rgba(29,161,242,${glowAlpha});
        }
        /* Expired hover: no glow, barely reacts — feels "dead" */
        .vb-expired:hover {
          transform: scale(1.07) rotate(1deg);
          filter: brightness(1.03);
        }
        .vb:active { transform: scale(0.95) rotate(0deg) !important; transition-duration: 0.1s !important; }

        /* ── Tooltip: 120ms delay so it feels intentional, not instant ── */
        .vb::after {
          content: attr(data-tip);
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%) translateY(5px);
          background: rgba(10,10,10,0.86);
          color: #efefef;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: ${tipFontSize}px;
          font-weight: 500;
          letter-spacing: 0.01em;
          white-space: nowrap;
          padding: 3px 8px;
          border-radius: 5px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
          transition-delay: 0s;
          backdrop-filter: blur(8px);
          z-index: 9999;
        }
        .vb:hover::after {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          transition-delay: 0.12s;
        }
      `}</style>

      <div
        ref={badgeRef}
        className={`vb ${isActive ? 'vb-active' : 'vb-expired'}`}
        data-tip={tooltipLabel}
        aria-label={tooltipLabel}
        role="img"
        style={{
          width:  size,
          height: size,
          // Layer 1 — hue-shifted gradient
          background: isActive ? activeGrad : expiredGrad,
          // Layer 4 — resting shadow (active) / minimal lift (expired)
          boxShadow: isActive
            ? `0 0 0 0 rgba(29,161,242,${glowAlpha}), 0 2px ${glowSpread}px rgba(29,161,242,0.18)`
            : '0 1px 3px rgba(0,0,0,0.14)',
          // Expired: transparent + matte — "lost", not "off"
          opacity: isRecentlyExpired && !isActive ? 0.76 : 1,
        }}
      >
        {/* Layer 2 — light catch: felt, not seen (opacity 0.28 vs old 0.45) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%',
            left: '10%',
            width: highlightSize,
            height: highlightSize * 0.5,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 75%)',
            pointerEvents: 'none',
          }}
        />

        {/* Layer 3 — bottom depth */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.14) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Layer 5 — check mark (dimmed on expired: 0.72 opacity) */}
        <svg
          width={checkSize}
          height={checkSize}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{ position: 'relative', zIndex: 1, flexShrink: 0, opacity: isActive ? 1 : 0.72 }}
        >
          <polyline
            points="4,13 9,18 20,7"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};

export default VerifiedBadge;