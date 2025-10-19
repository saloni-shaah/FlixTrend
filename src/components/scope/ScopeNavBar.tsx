
"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Music, TrendingUp, Video } from 'lucide-react';
import { motion } from 'framer-motion';

type ScopeView = 'videos' | 'music' | 'games' | 'trending';

const navItems = [
    { id: 'videos', icon: <Video size={20} />, label: 'Videos' },
    { id: 'music', icon: <Music size={20} />, label: 'Music' },
    { id: 'games', icon: <Gamepad2 size={20} />, label: 'Games' },
    { id: 'trending', icon: <TrendingUp size={20} />, label: 'Trending' },
];

export function ScopeNavBar({ activeView, setActiveView }: { activeView: ScopeView, setActiveView: (view: ScopeView) => void; }) {
    
    return (
        <nav 
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
        >
            <Link href="/home" className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 transition-colors">
                <ArrowLeft />
            </Link>

            <div className="flex items-center gap-1 text-lg font-bold text-white bg-black/40 p-1 rounded-full drop-shadow-lg">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveView(item.id as ScopeView)}
                        className={`relative px-3 py-1.5 rounded-full text-sm transition-colors ${activeView === item.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                         {activeView === item.id && (
                            <motion.div
                                layoutId="scope-nav-active"
                                className="absolute inset-0 bg-accent-cyan/30 rounded-full"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                           {item.icon}
                           {item.label}
                        </span>
                    </button>
                ))}
            </div>
            
            <div className="w-10"></div>
        </nav>
    );
}
