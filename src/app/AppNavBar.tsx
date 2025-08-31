"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/utils/AppStateContext";
import { Home, Search, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

function NavButton({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className="flex flex-col items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors">
      <Icon className={`${isActive ? 'text-brand-gold' : ''}`} />
      <span className={`text-xs font-semibold ${isActive ? 'text-foreground' : ''}`}>{label}</span>
      {isActive && (
        <motion.div 
          className="h-[2px] w-full bg-brand-gold rounded-full mt-1"
          layoutId="nav-underline"
        />
      )}
    </Link>
  );
}

export default function AppNavBar() {
  const pathname = usePathname();
  const { isCalling } = useAppState();
  const hideNav = pathname === "/login" || pathname === "/signup" || pathname === "/" || isCalling;

  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 bg-background/50 backdrop-blur-lg border-t border-glass-border flex justify-around items-center py-2">
      <NavButton href="/home" icon={Home} label="VibeSpace" />
      <NavButton href="/scope" icon={Search} label="Scope" />
      <NavButton href="/squad" icon={Users} label="Squad" />
      <NavButton href="/signal" icon={MessageSquare} label="Signal" />
    </nav>
  );
}
