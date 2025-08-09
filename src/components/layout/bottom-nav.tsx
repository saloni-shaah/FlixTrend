"use client";

import { Home, MessageSquare, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/vibespace", icon: Home, label: "VibeSpace" },
  { href: "/scope", icon: Search, label: "Scope" },
  { href: "/squad", icon: User, label: "Squad" },
  { href: "/messages", icon: MessageSquare, label: "Signal" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t glassmorphism z-40">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center text-xs gap-1 text-muted-foreground hover:text-primary transition-colors"
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className={cn("h-6 w-6", isActive && "text-primary animated-glow-sm drop-shadow-[0_0_5px_hsl(var(--primary))]")} />
              <span className={cn(isActive && "text-primary")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
