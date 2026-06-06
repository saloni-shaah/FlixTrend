'use client';

import { usePathname } from 'next/navigation';
import { MusicPlayerProvider } from '@/utils/MusicPlayerContext';
import { GlobalMusicPlayer } from '@/components/GlobalMusicPlayer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const noNavRoutes = [
    '/auth',
    '/welcome',
    '/settings/edit-profile',
    '/settings/account',
    '/settings/notifications',
    '/settings/privacy',
    '/settings/security',
    '/create',
    '/watch',   // ← video watch page: no top/bottom nav padding (YouTube-style)
  ];

  const hideNav = noNavRoutes.some(route => pathname.startsWith(route));

  return (
    <MusicPlayerProvider>
      <main className={`transition-all duration-300 ease-in-out ${hideNav ? 'pt-0 pb-0' : 'pt-16 pb-16'} md:pb-0`}>
        {children}
      </main>
      <GlobalMusicPlayer />
    </MusicPlayerProvider>
  );
}