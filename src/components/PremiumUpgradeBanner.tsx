
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function PremiumUpgradeBanner() {
    return (
        <Link href="/premium">
            <motion.div 
                className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-pink to-brand-gold cursor-pointer"
                whileHover={{ scale: 1.02 }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <Sparkles className="text-white" />
                        <div>
                            <h4 className="font-headline font-bold text-white">Go Premium!</h4>
                            <p className="text-xs text-white/80">Unlock blue tick, an ad-free experience & more.</p>
                        </div>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-white/20 text-white font-bold text-sm">Upgrade</span>
                </div>
            </motion.div>
        </Link>
    )
}
