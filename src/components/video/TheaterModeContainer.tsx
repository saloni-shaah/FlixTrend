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
      <div className="w-full bg-black">{children}</div>
    </>
  );
}
