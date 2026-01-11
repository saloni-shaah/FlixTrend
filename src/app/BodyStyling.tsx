"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/utils/firebaseClient';

export default function BodyStyling() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Define logged-out pages
    const loggedOutPages = [
        '/',
        '/login',
        '/signup',
        '/about',
        '/privacy',
        '/terms',
        '/contact'
    ];
    
    // Default to logged-out style while loading auth state
    if (loading) {
        document.body.classList.add('logged-out-background');
        document.body.classList.remove('logged-in-background');
        return;
    }

    // Check if the current path is one of the logged-out pages
    const isLoggedOutPage = loggedOutPages.includes(pathname);

    if (isAuthenticated && !isLoggedOutPage) {
      document.body.classList.add('logged-in-background');
      document.body.classList.remove('logged-out-background');
    } else {
      document.body.classList.add('logged-out-background');
      document.body.classList.remove('logged-in-background');
    }

    // Cleanup function to remove classes when the component unmounts
    return () => {
      document.body.classList.remove('logged-in-background', 'logged-out-background');
    };
  }, [pathname, isAuthenticated, loading]);

  return null; // This component does not render anything
}
