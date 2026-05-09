'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient';

export default function BodyStyling() {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [themeVersion, setThemeVersion] = useState(0);

    useEffect(() => {
        const handleThemeChange = () => {
            setThemeVersion(prev => prev + 1);
        };
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
        const themeOverride = localStorage.getItem('theme');
        const simpleMode = localStorage.getItem('simpleMode') === 'true';
        
        let finalTheme = 'light'; // Default to light
        if (themeOverride) {
            finalTheme = themeOverride; // Use 'light' or 'dark' from storage
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            finalTheme = 'dark'; // Or use system preference
        }

        const loggedOutPages = [
            '/', '/login', '/signup', '/signup/account-type', '/signup/avatar-banner',
            '/signup/complete-profile', '/signup/phone-verification', '/about',
            '/privacy', '/terms', '/faq', '/contact'
        ];
        
        // Always start with a clean slate
        document.body.className = '';
        document.documentElement.classList.remove('dark', 'light');

        if (loading) {
            document.body.classList.add('logged-out-background');
            document.documentElement.classList.add('dark');
            return;
        }

        const isLoggedOutPage = loggedOutPages.includes(pathname);

        if (!isAuthenticated || isLoggedOutPage) {
            document.body.classList.add('logged-out-background');
            document.documentElement.classList.add('dark');
            return;
        }

        // Apply the correct theme class to the <html> tag
        document.documentElement.classList.add(finalTheme);

        // Apply the body background style
        if (!simpleMode) {
            document.body.classList.add(finalTheme === 'dark' ? 'colorful-dark' : 'colorful-light');
        }

    }, [pathname, isAuthenticated, loading, themeVersion]); // Rerun on auth state or theme change

    return null;
}
