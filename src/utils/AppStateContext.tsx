"use client";
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AppState {
  isCalling: boolean;
  setIsCalling: (isCalling: boolean) => void;
  callTarget: any | null;
  setCallTarget: (target: any | null) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isCalling, setIsCalling] = useState(false);
  const [callTarget, setCallTarget] = useState<any | null>(null);

  const value = {
    isCalling,
    setIsCalling,
    callTarget,
    setCallTarget,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
