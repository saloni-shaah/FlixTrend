"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Subtitles,
  X,
  Wifi,
} from "lucide-react";

interface WatchSettingsPanelProps {
  open: boolean;
  isMobile: boolean;
  topOffset?: number;
  onClose: () => void;
  availableQualities: string[];
  selectedQuality: string;
  activeQualityLabel: string;
  onQualityChange: (quality: string) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  isLooping: boolean;
  onLoopChange: (value: boolean) => void;
  ambientMode: boolean;
  onAmbientChange: (value: boolean) => void;
  captionsUrl?: string;
  captionsEnabled: boolean;
  onCaptionsChange: (value: boolean) => void;
  onMiniPlayer?: () => void;
  onFullscreen?: () => void;
  isFullScreen?: boolean;
  onPiP?: () => void;
  isPiP?: boolean;
  brightnessLevel?: number;
  onBrightnessChange?: (value: number) => void;
  /** The currently detected network quality, e.g. "1080p", "720p", "480p" */
  networkQuality?: string;
}

export function WatchSettingsPanel({
  open,
  isMobile,
  topOffset = 0,
  onClose,
  availableQualities,
  selectedQuality,
  activeQualityLabel,
  onQualityChange,
  playbackRate,
  onPlaybackRateChange,
  isLooping,
  onLoopChange,
  ambientMode,
  onAmbientChange,
  captionsUrl,
  captionsEnabled,
  onCaptionsChange,
  onMiniPlayer,
  onFullscreen,
  isFullScreen,
  onPiP,
  isPiP,
  brightnessLevel,
  onBrightnessChange,
  networkQuality,
}: WatchSettingsPanelProps) {
  const showCaptions = !!captionsUrl;
  const panelStyle = isMobile ? { top: Math.max(topOffset, 0) } : undefined;

  /*
   * Network quality to human label.
   * The useNetworkQuality hook returns strings like "1080p", "720p", "480p", "360p".
   * We map them to a friendly label + colour for the settings panel.
   */
  const networkLabel = (() => {
    if (!networkQuality) return null;
    const n = parseInt(networkQuality.replace('p', ''));
    if (n >= 1080) return { text: "Excellent", color: "text-emerald-400" };
    if (n >= 720)  return { text: "Good",      color: "text-green-400" };
    if (n >= 480)  return { text: "Fair",       color: "text-yellow-400" };
    return              { text: "Poor",       color: "text-red-400" };
  })();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <motion.button
              key="watch-settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-x-0 bottom-0 z-50 pointer-events-auto bg-black/60 backdrop-blur-sm"
              style={{ top: Math.max(topOffset, 0) }}
              onClick={onClose}
              aria-label="Close settings"
              type="button"
            />
          )}

          <motion.div
            key="watch-settings-panel"
            initial={isMobile ? { y: "100%" } : { y: 10, opacity: 0, scale: 0.97 }}
            animate={isMobile ? { y: 0 }    : { y: 0,  opacity: 1, scale: 1 }}
            exit={isMobile    ? { y: "100%" } : { y: 10, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            style={panelStyle}
            data-watch-settings
            className={[
              "z-[70] text-white pointer-events-auto touch-auto",
              isMobile
                ? [
                    "fixed inset-x-0 bottom-0",
                    "rounded-t-3xl border-t border-white/10",
                    "bg-zinc-950/97 backdrop-blur-2xl",
                    "shadow-[0_-24px_80px_rgba(0,0,0,0.7)]",
                    "max-h-[82svh] overflow-y-auto overscroll-contain",
                    // safe-area so content isn't hidden behind home indicator
                    "pb-[env(safe-area-inset-bottom)]",
                  ].join(" ")
                : [
                    "absolute right-0 bottom-12",
                    "w-[19rem] max-h-[min(72svh,42rem)]",
                    "rounded-3xl border border-white/10",
                    "bg-black/90 backdrop-blur-2xl shadow-2xl",
                    "overflow-y-auto overscroll-contain",
                  ].join(" "),
            ].join(" ")}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={isMobile ? "p-5 pb-3" : "p-4"}>
              {/* Drag handle (mobile) */}
              {isMobile && (
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              )}

              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Settings</p>
                  <p className="mt-0.5 text-sm font-semibold text-white/90">Playback &amp; quality</p>
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  className="rounded-full bg-white/10 p-2 text-white/60 hover:bg-white/15 hover:text-white transition"
                  aria-label="Close settings"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Network quality indicator */}
              {networkLabel && networkQuality && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2.5">
                  <Wifi size={14} className={networkLabel.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80">
                      Connection: <span className={networkLabel.color}>{networkLabel.text}</span>
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Auto quality follows network · currently {networkQuality}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {onMiniPlayer && (
                  <button
                    onClick={onMiniPlayer}
                    type="button"
                    className="flex items-center justify-center gap-1 rounded-2xl bg-white/10 px-2 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/15 transition active:scale-95"
                  >
                    Mini <ChevronRight size={13} />
                  </button>
                )}
                {onFullscreen && (
                  <button
                    onClick={onFullscreen}
                    type="button"
                    className="flex items-center justify-center gap-1 rounded-2xl bg-white/10 px-2 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/15 transition active:scale-95"
                  >
                    {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    {isFullScreen ? "Exit" : "Full"}
                  </button>
                )}
                {onPiP && (
                  <button
                    onClick={onPiP}
                    type="button"
                    className="flex items-center justify-center gap-1 rounded-2xl bg-white/10 px-2 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/15 transition active:scale-95"
                  >
                    <PictureInPicture2 size={13} />
                    PiP
                  </button>
                )}
              </div>

              {/* Quality selector */}
              {availableQualities.length > 1 && (
                <div className="mb-4">
                  <SectionLabel>Quality</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {availableQualities.map((quality) => {
                      const isAuto = quality === "auto";
                      const isSelected = selectedQuality === quality;
                      /*
                       * For the "auto" pill we show what quality is currently active
                       * AND a small network-quality coloured dot so the user can tell
                       * at a glance whether their connection is limiting them.
                       */
                      return (
                        <button
                          key={quality}
                          onClick={() => onQualityChange(quality)}
                          type="button"
                          className={[
                            "rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                            isSelected
                              ? "bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black"
                              : "bg-white/10 text-white/75 hover:bg-white/15",
                          ].join(" ")}
                        >
                          {isAuto ? (
                            <span className="flex items-center gap-1">
                              Auto · {activeQualityLabel}
                              {networkLabel && (
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${networkLabel.color.replace('text-', 'bg-')}`} />
                              )}
                            </span>
                          ) : quality}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-white/35">
                    Auto mode adapts to your connection speed in real time.
                  </p>
                </div>
              )}

              {/* Playback speed */}
              <div className="mb-4">
                <SectionLabel>Speed</SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => onPlaybackRateChange(rate)}
                      type="button"
                      className={[
                        "rounded-2xl px-3 py-2 text-xs font-semibold transition active:scale-95",
                        playbackRate === rate
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/75 hover:bg-white/15",
                      ].join(" ")}
                    >
                      {rate === 1 ? "Normal" : `${rate}×`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1 border-t border-white/10 pt-4">
                <ToggleRow label="Loop" value={isLooping} onChange={onLoopChange} helper="Repeat this video." />
                <ToggleRow label="Ambient" value={ambientMode} onChange={onAmbientChange} helper="Background glow from the current frame." />
                {showCaptions && (
                  <ToggleRow
                    label="Captions"
                    value={captionsEnabled}
                    onChange={onCaptionsChange}
                    helper="Show subtitles when available."
                    icon={<Subtitles size={13} />}
                  />
                )}
              </div>

              {/* Brightness */}
              {typeof brightnessLevel === "number" && onBrightnessChange && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/85">Brightness</span>
                    <span className="text-xs text-white/40">{Math.round(brightnessLevel * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0.65" max="1" step="0.01"
                    value={brightnessLevel}
                    onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              )}

              {/* Gesture hint */}
              <p className="mt-5 text-[11px] leading-relaxed text-white/30 border-t border-white/8 pt-4">
                Swipe horizontally to seek · right side swipe for volume · left side for brightness
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/40">{children}</p>
  );
}

function ToggleRow({
  label, helper, value, onChange, icon,
}: {
  label: string;
  helper: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-white/50">{icon}</span>}
          <span className="text-sm font-medium text-white/85">{label}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-white/40">{helper}</p>
      </div>

      <button
        onClick={() => onChange(!value)}
        type="button"
        aria-pressed={value}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          value ? "bg-gradient-to-r from-fuchsia-500 to-cyan-400" : "bg-white/15",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200",
            value ? "left-[22px]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}