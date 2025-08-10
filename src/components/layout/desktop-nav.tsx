
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Logo } from "../flixtrend/logo";

const navItems = [
  { href: "/vibespace", icon: Home, label: "VibeSpace" },
  { href: "/scope", icon: Search, label: "Scope" },
  { href: "/squad", icon: User, label: "Squad" },
  { href: "/messages", icon: MessageSquare, label: "Signal" },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <Sidebar className="hidden md:flex flex-col" collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </Sidebar>
  );
}
