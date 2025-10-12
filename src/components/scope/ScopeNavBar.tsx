"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function ScopeNavBar({ onDoubleClick }: { onDoubleClick: () => void; }) {
    
    return (
        <nav 
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent"
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        >
            <Link href="/home" className="p-2 text-white bg-black/30 rounded-full">
                <ArrowLeft />
            </Link>
            <div className="flex items-center gap-2 text-lg font-bold text-white drop-shadow-lg">
                <span>Scope</span>
            </div>
            {/* This empty div is a spacer to keep the center element perfectly centered */}
            <div className="w-10"></div>
        </nav>
    );
}
