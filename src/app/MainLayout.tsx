'use client';

import { usePathname } from 'next/navigation';
import AppNavBar from '@/app/AppNavBar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // This will hide the navbar on any sub-route of /watch or /signup
    const shouldHideBottomNav = pathname.startsWith('/watch') || pathname.startsWith('/signup');

    return (
        <>
            {children}
            {!shouldHideBottomNav && <AppNavBar />}
        </>
    );
}
