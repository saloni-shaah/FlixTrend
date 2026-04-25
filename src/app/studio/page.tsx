'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Film, Users, Settings, Home, Music, Menu, X } from 'lucide-react';
import { auth, db } from "@/utils/firebaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ContentManagement } from '@/components/studio/ContentManagement';
import { Dashboard } from '@/components/studio/Dashboard';
import { Analytics } from '@/components/studio/Analytics';
import { Community } from '@/components/studio/Community';
import { StudioSettings } from '@/components/studio/StudioSettings';
import { MusicManagement } from '@/components/studio/MusicManagement';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

const StudioPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const handleAuth = () => {
        setLoading(false);
        setAuthError(null);
    };

    if (token) {
      signInWithCustomToken(auth, token)
        .then(() => {
          handleAuth();
          window.history.replaceState(null, '', window.location.pathname);
        })
        .catch((error) => {
          console.error("Custom token sign-in failed:", error);
          setAuthError("Invalid authentication token.");
          setLoading(false);
        });
    } else {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                handleAuth();
            } else {
                setAuthError("You must be signed in to access the studio.");
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }
  }, [searchParams]);

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center text-white">Verifying creator access...</div>;
  }

  if (authError) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center text-white p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-red-400 mb-8">{authError}</p>
        <button onClick={() => router.push('/')} className="btn-primary">Go to Homepage</button>
      </div>
    );
  }

  const renderContent = () => {
    const components: { [key: string]: React.ComponentType } = {
        dashboard: Dashboard,
        content: ContentManagement,
        songs: MusicManagement,
        analytics: Analytics,
        community: Community,
        settings: StudioSettings,
    };
    const Component = components[activeTab] || Dashboard;
    return <Component />;
  };

  const NavItem = ({ name, icon: Icon, tabName }: { name: string, icon: React.ElementType, tabName: string }) => (
    <button
      onClick={() => { setActiveTab(tabName); setSidebarOpen(false); }}
      className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors duration-200 text-gray-300 hover:text-white hover:bg-white/5
        ${activeTab === tabName ? 'bg-accent-cyan/10 text-accent-cyan font-semibold' : ''}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium text-sm tracking-wider truncate">{name}</span>
    </button>
  );

  const sidebarContent = (
      <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2.5 mb-8 p-4 pt-6">
              <BarChart3 className="h-7 w-7 text-accent-cyan" />
              <h1 className="text-xl font-bold text-white">Creator Studio</h1>
          </div>
          <div className="flex-grow overflow-y-auto px-2"> {/* Scrollable Nav Area */}
            <nav className="space-y-2">
                <NavItem name="Dashboard" icon={Home} tabName="dashboard" />
                <NavItem name="Content" icon={Film} tabName="content" />
                <NavItem name="Songs" icon={Music} tabName="songs" />
                <NavItem name="Analytics" icon={BarChart3} tabName="analytics" />
                <NavItem name="Community" icon={Users} tabName="community" />
            </nav>
          </div>
          <div className="pt-4 p-2 border-t border-white/10">
             <NavItem name="Settings" icon={Settings} tabName="settings" />
          </div>
      </div>
  );

  return (
    // Added pb-20 for mobile/tablet to push content above the bottom nav bar, and lg:pb-4 to revert on desktop.
    <div className="min-h-screen w-full text-gray-200 font-sans flex flex-row p-4 pb-20 lg:pb-4 gap-4">
        
        {/* --- Sidebar Section --- */}
        
        {/* Mobile Sidebar Toggle - Anchored to the top-left of the viewport */}
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden fixed top-6 left-6 z-50 p-2 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
            {isSidebarOpen ? <X/> : <Menu />}
        </button>

        {/* Desktop Sidebar - Now a floating glass-card */}
        <aside className="hidden lg:flex flex-col w-64 h-full glass-card rounded-2xl overflow-hidden">
            {sidebarContent}
        </aside>

        {/* Mobile Sidebar (Drawer) */}
        <AnimatePresence>
            {isSidebarOpen && (
                <motion.div 
                    initial={{ x: '-100%' }} 
                    animate={{ x: 0 }} 
                    exit={{ x: '-100%' }} 
                    transition={{ type: 'spring', stiffness: 300, damping: 30}}
                    className="lg:hidden fixed top-4 bottom-20 left-4 z-40 w-72 glass-card rounded-2xl overflow-hidden"
                >
                    {sidebarContent}
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- Main Content Section --- */}
        {/* Main content area is also a floating glass-card */}
        <main className="flex-1 h-full glass-card rounded-2xl overflow-auto">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeTab} 
                    initial={{opacity: 0, y: 15}} 
                    animate={{opacity: 1, y: 0}} 
                    exit={{opacity: 0, y: -15}} 
                    transition={{duration: 0.2}}
                    className="h-full"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </main>
    </div>
  );
};

export default StudioPage;
