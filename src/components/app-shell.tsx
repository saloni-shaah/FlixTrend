'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flame,
  MessageCircle,
  Newspaper,
  Search,
  User,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navItems = [
  { href: '/', icon: Newspaper, label: 'News Feed' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/trending', icon: Flame, label: 'Trending' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Flame className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold font-headline text-primary">
                TrendStream
              </h1>
            </Link>
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:px-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive =
    href === '/' ? pathname === href : pathname.startsWith(href);

  return (
    <SidebarMenuItem>
      <Link
        href={href}
        passHref
        legacyBehavior
        onClick={() => isMobile && setOpenMobile(false)}
      >
        <SidebarMenuButton isActive={isActive} tooltip={label}>
          <Icon />
          <span>{label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Avatar>
            <AvatarImage
              src="https://picsum.photos/id/237/40/40"
              alt="User Avatar"
              width={40}
              height={40}
              data-ai-hint="user avatar"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
