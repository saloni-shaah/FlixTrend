"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export function AppNavFABs() {
  const pathname = usePathname();
  const showNav = ["/home", "/scope", "/squad", "/signal"].some((p) => pathname.startsWith(p));
  const showAIFab = pathname === "/home" || pathname === "/signal";
  if (!showNav) return null;
  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-black/80 border-t border-accent-cyan/20 flex justify-around items-center py-2">
        <NavButton href="/home" icon="🏠" label="Home" />
        <NavButton href="/scope" icon="🔍" label="Scope" />
        <NavButton href="/squad" icon="👥" label="Squad" />
        <NavButton href="/signal" icon="📩" label="Signal" />
      </nav>
      {/* Top-Right FABs */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 md:top-8 md:right-8">
        <button className="rounded-full bg-accentCyan p-3 shadow-fab-glow hover:scale-110 transition-all" title="Notifications">
          🔔
        </button>
        <button className="rounded-full bg-accentPink p-3 shadow-fab-glow hover:scale-110 transition-all" title="Create Post">
          ➕
        </button>
      </div>
      {/* Bottom-Right Almighty AI FAB (only on home and signal) */}
      {showAIFab && (
        <button className="fixed bottom-20 right-4 z-50 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan p-5 shadow-fab-glow animate-pulse hover:scale-110 transition-all md:bottom-8" title="Almighty AI">
          <Image src="/almighty-logo.svg" alt="Almighty AI Logo" width={48} height={48} className="rounded-full" />
        </button>
      )}
    </>
  );
}

function NavButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center text-xs text-gray-300 hover:text-accentCyan transition-all">
      <span className="text-2xl mb-1">{icon}</span>
      {label}
    </Link>
  );
} 