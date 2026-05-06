"use client";
import React, { useRef, useCallback, useEffect, useState } from "react";

interface ProgressBarProps {
  progress: number;
  buffered?: number;
  onScrub?: (percentage: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  variant?: "feed" | "watch" | "flow";
  currentTime?: number;
  duration?: number;
}

const fmt = (s: number) => {
  if (isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  buffered = 0,
  onScrub,
  onScrubStart,
  onScrubEnd,
  variant = "feed",
  currentTime = 0,
  duration = 0,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const interactive = !!onScrub;

  const getPct = useCallback((clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
  }, []);

  const update = useCallback(
    (clientX: number) => onScrub?.(getPct(clientX)),
    [onScrub, getPct]
  );

  const onMouseMove = useCallback((e: MouseEvent) => update(e.clientX), [update]);
  const onTouchMove = useCallback((e: TouchEvent) => update(e.touches[0].clientX), [update]);
  const onUp = useCallback(() => {
    setIsDragging(false);
    onScrubEnd?.();
  }, [onScrubEnd]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, onMouseMove, onTouchMove, onUp]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    setIsDragging(true);
    onScrubStart?.();
    update(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    setIsDragging(true);
    onScrubStart?.();
    update(e.touches[0].clientX);
  };

  const showThumb = interactive && variant !== "feed";
  const trackH = variant === "watch" ? "5px" : "3px";
  const hoverH = variant === "watch" ? "7px" : "5px";

  return (
    <div
      className="w-full flex items-center gap-2.5 group select-none pointer-events-auto"
      style={{ paddingBlock: variant === "feed" ? "4px" : "8px" }}
    >
      {variant === "flow" && (
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono, monospace)",
            color: "rgba(255,255,255,0.6)",
            minWidth: 32,
          }}
        >
          {fmt(currentTime)}
        </span>
      )}

      {variant === "watch" && (
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono, monospace)",
            color: "rgba(255,255,255,0.55)",
            minWidth: 32,
          }}
        >
          {fmt(currentTime)}
        </span>
      )}

      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative flex-1 rounded-full cursor-pointer transition-all duration-150"
        style={{
          height: isDragging ? hoverH : trackH,
          background: "rgba(255,255,255,0.12)",
        }}
      >
        {/* Buffer */}
        <div
          className="absolute inset-y-0 left-0 rounded-full pointer-events-none transition-all"
          style={{ width: `${buffered}%`, background: "rgba(255,255,255,0.18)" }}
        />

        {/* Fill — hot pink → purple → cyan, matching FlixTrend brand */}
        <div
          className="absolute inset-y-0 left-0 rounded-full pointer-events-none flex items-center justify-end"
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: "linear-gradient(90deg, #ff2d78 0%, #7b5fff 55%, #00cfff 100%)",
            transition: isDragging ? "none" : "width 0.05s linear",
          }}
        >
          {/* Feed: animated pulse dot */}
          {variant === "feed" && (
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 0 6px 2px rgba(0,207,255,0.7)",
                marginRight: -3.5,
                flexShrink: 0,
                animation: "fx-pulse 1.6s ease-in-out infinite",
              }}
            />
          )}

          {/* Flow / Watch: draggable thumb */}
          {showThumb && (
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: isDragging
                  ? "0 0 0 4px rgba(255,45,120,0.45)"
                  : "0 0 0 3px rgba(123,95,255,0.5)",
                marginRight: -6.5,
                flexShrink: 0,
                transform: isDragging ? "scale(1.4)" : "scale(1)",
                opacity: variant === "watch" && !isDragging ? 0 : 1,
                transition: "transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease",
              }}
              className={variant === "watch" ? "group-hover:opacity-100" : ""}
            />
          )}
        </div>
      </div>

      {variant === "flow" && (
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono, monospace)",
            color: "rgba(255,255,255,0.6)",
            minWidth: 32,
            textAlign: "right",
          }}
        >
          {fmt(duration)}
        </span>
      )}

      {variant === "watch" && (
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono, monospace)",
            color: "rgba(255,255,255,0.55)",
            minWidth: 32,
            textAlign: "right",
          }}
        >
          {fmt(duration)}
        </span>
      )}

      {/* Keyframe for pulse dot — injected once */}
      <style>{`
        @keyframes fx-pulse {
          0%,100% { box-shadow: 0 0 4px 1px rgba(0,207,255,0.6); }
          50%      { box-shadow: 0 0 10px 4px rgba(255,45,120,0.7); }
        }
      `}</style>
    </div>
  );
};