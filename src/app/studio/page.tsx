'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Film, Users, MessageSquare, Settings, Home, LogOut } from 'lucide-react';
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ContentManagement } from '@/components/studio/ContentManagement';
import { Dashboard } from '@/components/studio/Dashboard';
import { Analytics } from '@/components/studio/Analytics';
import { Community } from '@/components/studio/Community';
import { StudioSettings } from '@/components/studio/StudioSettings'; // Import the final component

const db = getFirestore(app);

const StudioPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndCreatorStatus = async () => {
      auth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              const userDocRef = doc(db, "users", user.uid);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists() && userDoc.data().accountType === 'creator') {
                setLoading(false); // User is a creator, so we can show the page
              } else {
                router.push('/'); // Redirect if not a creator
              }
            } catch (error) {
              console.error("Error checking creator status:", error);
              router.push('/'); // Redirect on error
            }
          } else {
             router.push('/');
          }
      });
    };
    checkAuthAndCreatorStatus();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Verifying creator access...</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'content': return <ContentManagement />;
      case 'analytics': return <Analytics />;
      case 'community': return <Community />;
      case 'settings': return <StudioSettings />;
      default: return <Dashboard />;
    }
  };
  
  const NavItem = ({ name, icon: Icon, tabName }: { name: string, icon: React.ElementType, tabName: string }) => (
    <button 
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center space-x-4 p-3 rounded-lg w-full text-left transition-colors ${activeTab === tabName ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}>
      <Icon className="h-6 w-6" />
      <span className="font-semibold text-lg">{name}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 flex flex-col justify-between shadow-2xl">
        <div>
            <div className="flex items-center space-x-2 mb-10">
                <BarChart3 className="h-8 w-8 text-purple-400"/>
                <h1 className="text-2xl font-bold">Creator Studio</h1>
            </div>
            <nav className="space-y-4">
              <NavItem name="Dashboard" icon={Home} tabName="dashboard" />
              <NavItem name="Content" icon={Film} tabName="content" />
              <NavItem name="Analytics" icon={BarChart3} tabName="analytics" />
              <NavItem name="Community" icon={Users} tabName="community" />
              <NavItem name="Settings" icon={Settings} tabName="settings" />
            </nav>
        </div>
        <div>
            <button 
              onClick={() => auth.signOut().then(() => router.push('/'))} 
              className="flex items-center space-x-4 p-3 rounded-lg w-full text-left transition-colors hover:bg-red-600">
               <LogOut className="h-6 w-6" />
               <span className="font-semibold text-lg">Logout</span>
            </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-900 overflow-auto">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default StudioPage;
