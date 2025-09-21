"use client";

import { cn } from "../../lib/utils";

const LoadingDots = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn("flex items-center justify-center space-x-1", className)}
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
      <div className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:-0.3s]" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:-0.15s]" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
    </div>
  );
};

export default LoadingDots;
