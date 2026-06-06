"use client";
import React from "react";

interface Props {
  isTheaterMode: boolean;
  children: React.ReactNode;
}

export function TheaterModeContainer({ isTheaterMode, children }: Props) {
  return (
    <>
      {isTheaterMode && (
        <style>{`
          .watch-upnext { display: none !important; }
          .watch-main { max-width: 100% !important; }
          .watch-theater-expand { max-width: 100% !important; flex: 1 1 100% !important; }
        `}</style>
      )}
      {/*
        No wrapper div with overflow-hidden here — that was clipping the ambient canvas
        and preventing true edge-to-edge on mobile. The player itself manages its own
        overflow. We just pass children through transparently.
      */}
      {children}
    </>
  );
}