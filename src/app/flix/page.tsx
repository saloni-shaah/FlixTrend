
"use client";
import React, { useState } from "react";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Music, Gamepad2 } from 'lucide-react';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';

const Trendboard = dynamic(() => import('@/components/flix/Trendboard').then(mod => mod.Trendboard), { loading: () => <VibeSpaceLoader />, ssr: false });
const MusicDiscovery = dynamic(() => import('@/components/MusicDiscovery').then(mod => mod.MusicDiscovery), { loading: () => <VibeSpaceLoader />, ssr: false });
const GamesHub = dynamic(() => import('@/components/GamesHub').then(mod => mod.GamesHub), { loading: () => <VibeSpaceLoader />, ssr: false });

const tabs = [
    { id: 'trends', label: 'Trends', icon: <Flame size={18} />, component: <Trendboard currentPost={null} /> },
    { id: 'music', label: 'Music', icon: <Music size={18} />, component: <MusicDiscovery /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 size={18} />, component: <GamesHub /> }
];

export default function FlixPage() {
    const [activeTab, setActiveTab] = useState('trends');
    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center min-h-screen">
            <h1 className="text-4xl md:text-5xl font-headline font-bold bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-4 text-center">
                Flix Community Hub
            </h1>
            <p className="text-gray-400 text-center mb-8">Discover what's trending, find new music, and play games.</p>

            <div className="flex justify-center gap-2 p-1.5 rounded-full bg-black/30 mb-8 sticky top-4 z-20 backdrop-blur-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="flix-active-pill"
                                className="absolute inset-0 bg-accent-pink rounded-full"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">{tab.icon} {tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {ActiveComponent}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
