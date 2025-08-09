import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("font-headline text-2xl font-extrabold tracking-tight", className)}>
      <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
        Flixtrend
      </span>
    </div>
  );
}
