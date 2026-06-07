'use client';

import { useEffect, useRef } from "react";
import { createStableVolumeController, StableVolumeStrength } from "@/lib/audio/stableVolume";
import type { RefObject } from "react";

interface UseStableVolumeOptions {
  mediaElementRef: RefObject<HTMLMediaElement | null>;
  enabled: boolean;
  strength: StableVolumeStrength;
  baseVolume: number;
}

export function useStableVolume({
  mediaElementRef,
  enabled,
  strength,
  baseVolume,
}: UseStableVolumeOptions) {
  const controllerRef = useRef<ReturnType<typeof createStableVolumeController> | null>(null);

  useEffect(() => {
    controllerRef.current ??= createStableVolumeController({ enabled, strength, baseVolume });
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    controller.attachMediaElement(mediaElementRef.current);
  });

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    controller.updateStrength(strength);
  }, [strength]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    controller.updateBaseVolume(baseVolume);
  }, [baseVolume]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (enabled) {
      void controller.enable();
    } else {
      controller.disable();
    }
  }, [enabled]);

  return controllerRef.current;
}
