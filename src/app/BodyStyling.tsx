'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient';

export default function BodyStyling() {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    // Re-render on theme change event
    const [_, setRender] = useState(0);

    useEffect(() => {
        const handleThemeChange = () => setRender(Math.random());
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setIsAuthenticated(!!user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Get theme settings from localStorage
        const theme = localStorage.getItem('theme') || 'light';
        const simpleMode = localStorage.getItem('simpleMode') === 'true';

        // Define logged-out pages
        const loggedOutPages = [
            '/', '/login', '/signup', '/signup/account-type', '/signup/avatar-banner',
            '/signup/complete-profile', '/signup/phone-verification', '/about',
            '/privacy', '/terms', '/faq', '/contact'
        ];
        
        // Clear all theme-related classes first
        document.body.className = '';
        document.documentElement.classList.remove('dark', 'light');

        if (loading) {
            document.body.classList.add('logged-out-background');
            document.documentElement.classList.add('dark'); // Logged out is always dark
            return;
        }

        const isLoggedOutPage = loggedOutPages.includes(pathname);

        if (!isAuthenticated || isLoggedOutPage) {
            document.body.classList.add('logged-out-background');
            document.documentElement.classList.add('dark');
            return;
        }

        // Apply theme to <html> tag
        document.documentElement.classList.add(theme);

        // Apply background to <body> tag
        if (simpleMode) {
            // Simple mode doesn't get a special class, it just uses the default
            // theme background color (white or dark grey).
        } else {
            document.body.classList.add(theme === 'dark' ? 'colorful-dark' : 'colorful-light');
        }

    }, [pathname, isAuthenticated, loading, _]); // Rerun on auth state or theme change

    return null;
}
