"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

function NavButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 px-2 py-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

export default function AppNavBar() {
  const pathname = usePathname();
  const hideNav = pathname === "/login" || pathname === "/signup" || pathname === "/";
  if (hideNav) return null;
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 bg-black/80 border-t border-accent-cyan/20 flex justify-around items-center py-2">
      <NavButton href="/home" icon="🏠" label="Home" />
      <NavButton href="/scope" icon="🔍" label="Scope" />
      <NavButton href="/squad" icon="👥" label="Squad" />
      <NavButton href="/signal" icon="📩" label="Signal" />
    </nav>
  );
} 