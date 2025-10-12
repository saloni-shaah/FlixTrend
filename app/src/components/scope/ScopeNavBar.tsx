
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FlixTrendLogo } from '../FlixTrendLogo';

export function ScopeNavBar() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');

    const navItems = [
        { id: 'foryou', label: 'For You', icon: <Flame size={16} /> },
        { id: 'following', label: 'Following', icon: <Users size={16} /> },
    ];

    return (
        <nav className="fixed top-0 left-0 w-full z-50 p-4">
            <div className="glass-card flex items-center justify-between p-2">
                <button 
                    onClick={() => router.back()}
                    className="p-3 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-full">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={cn(
                                "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
                                activeTab === item.id ? "text-primary" : "text-gray-400 hover:text-white"
                            )}
                        >
                            {activeTab === item.id && (
                                <motion.div
                                    layoutId="scope-nav-active-pill"
                                    className="absolute inset-0 bg-gradient-to-r from-accent-pink to-accent-purple rounded-full"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{item.icon}</span>
                            <span className="relative z-10">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="w-10 h-10 flex items-center justify-center">
                   <FlixTrendLogo size={28} />
                </div>
            </div>
        </nav>
    );
}
