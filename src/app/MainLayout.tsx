'use client';

import { usePathname } from 'next/navigation';
import AppNavBar from '@/app/AppNavBar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // This will hide the navbar on any sub-route of /watch
    const shouldHideBottomNav = pathname.startsWith('/watch');

    return (
        <>
            {children}
            {!shouldHideBottomNav && <AppNavBar />}
        </>
    );
}
