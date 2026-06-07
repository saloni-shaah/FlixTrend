export type StableVolumeStrength = "low" | "medium" | "high";

export interface StableVolumeOptions {
  enabled: boolean;
  strength: StableVolumeStrength;
  baseVolume?: number;
}

export interface StableVolumeController {
  attachMediaElement(element: HTMLMediaElement | null): void;
  enable(): Promise<void>;
  disable(): void;
  updateStrength(strength: StableVolumeStrength): void;
  updateBaseVolume(volume: number): void;
  dispose(): void;
}

type ChainConfig = {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  gain: number;
};

const STRENGTHS: Record<StableVolumeStrength, ChainConfig> = {
  low: { threshold: -28, ratio: 2.5, attack: 0.01, release: 0.18, gain: 1.08 },
  medium: { threshold: -22, ratio: 4, attack: 0.005, release: 0.12, gain: 1.14 },
  high: { threshold: -18, ratio: 6, attack: 0.003, release: 0.08, gain: 1.2 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeGain(volume: number, makeup: number) {
  return clamp(volume * makeup, 0, 1.35);
}

export function createStableVolumeController(
  options: StableVolumeOptions,
): StableVolumeController {
  let mediaElement: HTMLMediaElement | null = null;
  let audioContext: AudioContext | null = null;
  let sourceNode: MediaElementAudioSourceNode | null = null;
  let compressorNode: DynamicsCompressorNode | null = null;
  let gainNode: GainNode | null = null;
  let analyserNode: AnalyserNode | null = null;
  let cleanupAttached = false;
  let disposed = false;
  let enabled = options.enabled;
  let strength = options.strength;
  let baseVolume = options.baseVolume ?? 1;
  let lastAppliedMediaVolume: number | null = null;

  const applyGain = () => {
    if (!gainNode) return;
    const cfg = STRENGTHS[strength];
    gainNode.gain.setTargetAtTime(safeGain(baseVolume, cfg.gain), audioContext?.currentTime ?? 0, 0.02);
  };

  const applyCompressor = () => {
    if (!compressorNode) return;
    const cfg = STRENGTHS[strength];
    compressorNode.threshold.setValueAtTime(cfg.threshold, audioContext?.currentTime ?? 0);
    compressorNode.ratio.setValueAtTime(cfg.ratio, audioContext?.currentTime ?? 0);
    compressorNode.attack.setValueAtTime(cfg.attack, audioContext?.currentTime ?? 0);
    compressorNode.release.setValueAtTime(cfg.release, audioContext?.currentTime ?? 0);
    compressorNode.knee.setValueAtTime(18, audioContext?.currentTime ?? 0);
  };

  const syncVolume = () => {
    if (!mediaElement) return;
    baseVolume = clamp(mediaElement.volume, 0, 1);
    if (enabled && gainNode) applyGain();
    lastAppliedMediaVolume = mediaElement.volume;
  };

  const attachVolumeListener = () => {
    if (!mediaElement || cleanupAttached) return;
    mediaElement.addEventListener("volumechange", syncVolume);
    cleanupAttached = true;
  };

  const detachVolumeListener = () => {
    if (!mediaElement || !cleanupAttached) return;
    mediaElement.removeEventListener("volumechange", syncVolume);
    cleanupAttached = false;
  };

  const ensureContext = () => {
    if (!mediaElement) return null;
    if (typeof window === "undefined") return null;
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioContext) audioContext = new AudioContextCtor();
    return audioContext;
  };

  const connectGraph = async () => {
    if (!enabled || disposed || !mediaElement) return;
    const ctx = ensureContext();
    if (!ctx) return;
    if (!sourceNode) {
      try {
        sourceNode = ctx.createMediaElementSource(mediaElement);
      } catch {
        return;
      }
    }
    if (!compressorNode) compressorNode = ctx.createDynamicsCompressor();
    if (!gainNode) gainNode = ctx.createGain();
    if (!analyserNode) analyserNode = ctx.createAnalyser();

    applyCompressor();
    applyGain();

    try {
      sourceNode.disconnect();
      compressorNode.disconnect();
      gainNode.disconnect();
      analyserNode.disconnect();
    } catch {}

    sourceNode.connect(compressorNode);
    compressorNode.connect(gainNode);
    gainNode.connect(analyserNode);
    analyserNode.connect(ctx.destination);

    mediaElement.muted = true;
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }
  };

  const disconnectGraph = () => {
    if (!mediaElement) return;
    try {
      sourceNode?.disconnect();
      compressorNode?.disconnect();
      gainNode?.disconnect();
      analyserNode?.disconnect();
    } catch {}
    mediaElement.muted = false;
    if (lastAppliedMediaVolume !== null) {
      mediaElement.volume = lastAppliedMediaVolume;
    }
  };

  attachVolumeListener();

  return {
    attachMediaElement(element) {
      if (disposed || element === mediaElement) return;
      detachVolumeListener();
      if (mediaElement && enabled) disconnectGraph();
      mediaElement = element;
      baseVolume = clamp(element?.volume ?? baseVolume, 0, 1);
      attachVolumeListener();
      if (enabled) void connectGraph();
    },
    async enable() {
      enabled = true;
      if (!mediaElement) return;
      baseVolume = clamp(mediaElement.volume, 0, 1);
      await connectGraph();
    },
    disable() {
      enabled = false;
      disconnectGraph();
    },
    updateStrength(nextStrength) {
      strength = nextStrength;
      if (!enabled) return;
      applyCompressor();
      applyGain();
    },
    updateBaseVolume(volume) {
      baseVolume = clamp(volume, 0, 1);
      if (!enabled || !gainNode) return;
      applyGain();
    },
    dispose() {
      disposed = true;
      detachVolumeListener();
      disconnectGraph();
      try {
        sourceNode?.disconnect();
        compressorNode?.disconnect();
        gainNode?.disconnect();
        analyserNode?.disconnect();
      } catch {}
      audioContext?.close().catch(() => {});
      sourceNode = null;
      compressorNode = null;
      gainNode = null;
      analyserNode = null;
      audioContext = null;
      mediaElement = null;
    },
  };
}

export const stableVolumePresets = STRENGTHS;
