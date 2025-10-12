"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function ScopeNavBar({ onDoubleClick }: { onDoubleClick: () => void; }) {
    const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');

    return (
        <nav className="w-full flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-sm sticky top-0 z-20 shrink-0">
            <Link href="/home" className="p-2 text-white">
                <ArrowLeft />
            </Link>
            <div className="flex items-center gap-2 p-1 bg-black/50 rounded-full" onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}>
                <button onClick={() => setActiveTab('foryou')} className={`relative px-4 py-1 text-sm font-bold rounded-full ${activeTab === 'foryou' ? 'text-white' : 'text-gray-400'}`}>
                    For You
                    {activeTab === 'foryou' && <motion.div className="absolute inset-0 bg-accent-cyan/80 rounded-full -z-10" layoutId="scope-nav-pill" />}
                </button>
                <button onClick={() => setActiveTab('following')} className={`relative px-4 py-1 text-sm font-bold rounded-full ${activeTab === 'following' ? 'text-white' : 'text-gray-400'}`}>
                    Following
                    {activeTab === 'following' && <motion.div className="absolute inset-0 bg-accent-cyan/80 rounded-full -z-10" layoutId="scope-nav-pill" />}
                </button>
            </div>
             {/* This empty div is a spacer to keep the center element perfectly centered */}
            <div className="w-10"></div>
        </nav>
    );
}
