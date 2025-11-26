
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export function ChatLobby() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center text-gray-500"
        >
            <MessageSquare className="mx-auto mb-4 text-gray-600" size={64} strokeWidth={1} />
            <h2 className="text-xl font-bold text-gray-300">Welcome to Signal</h2>
            <p>Select a chat from the left to start a conversation.</p>
        </motion.div>
    );
}
