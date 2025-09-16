
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Users, Heart, Bot, Brain, MapPin, Search, Music, Video } from 'lucide-react';

const gameCategories = [
    {
        title: "Social & Interactive",
        icon: <Users className="text-accent-pink"/>,
        games: [
            { name: "Trend Chase", description: "Quickly pick the real trending post among fakes. Compete with friends for the top spot!" },
            { name: "Flash Poll Wars", description: "Predict which side of a fun poll will get the majority vote. Settle debates with data." },
            { name: "Squad Quests", description: "Team up with your squad to solve daily riddles and meme puzzles." },
        ]
    },
    {
        title: "Quick Play",
        icon: <Video className="text-accent-cyan"/>,
        games: [
            { name: "Tap the Vibe", description: "A rhythm game synced to music from posts. Tap to the beat!" },
            { name: "FlixSwipe", description: "Rapidly categorize posts into 'Music', 'Meme', or 'Movie' before the timer runs out." },
            { name: "Spot the Fake", description: "Two posts appear. One is AI-generated. Can you spot the real one?" },
        ]
    },
    {
        title: "Location & Social",
        icon: <MapPin className="text-accent-green"/>,
        games: [
            { name: "Radar Hunt", description: "AR-style treasure hunts where hints are posted as vibes in the feed." },
            { name: "Geo Vibes", description: "Unlock badges by posting vibes from different real-world locations." },
        ]
    },
    {
        title: "Brainy & Meme-Driven",
        icon: <Brain className="text-brand-gold"/>,
        games: [
            { name: "Caption Clash", description: "A photo is shown. Submit the wittiest caption. Users vote for the best." },
            { name: "Vibe Puzzle", description: "Solve mini jigsaw puzzles made from trending posts to unlock exclusive content." },
            { name: "Emoji Decode", description: "Guess the movie, song, or meme from a string of emojis faster than your friends." },
        ]
    },
    {
        title: "Almighty AI Twist",
        icon: <Bot className="text-accent-purple"/>,
        games: [
            { name: "AI Roast Battle", description: "Almighty AI throws a funny roast at you. Reply with your best comeback. Let the votes decide!" },
            { name: "Daily Almighty Challenge", description: "A daily quiz, riddle, or creative prompt from your AI companion. Earn badges for completing." },
            { name: "AI vs You", description: "A fast-paced trivia duel between you and Almighty AI. Who's smarter?" },
        ]
    }
];

export function GamesHub() {
    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-8">
                Community Games
            </h2>
            
            <p className="text-center text-gray-400 mb-12 max-w-2xl">
                Get ready for a new era of social gaming! These lightweight, interactive mini-games are built right into the FlixTrend experience. Challenge friends, join quests, and earn rewards. More games coming soon!
            </p>

            <div className="w-full space-y-12">
                {gameCategories.map((category, index) => (
                    <motion.section 
                        key={category.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <h3 className="flex items-center gap-3 text-2xl font-headline font-bold mb-6">
                            {category.icon}
                            <span className="bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent">{category.title}</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.games.map(game => (
                                <div key={game.name} className="glass-card p-6 flex flex-col gap-3 relative overflow-hidden">
                                     <div className="absolute top-2 right-2 px-3 py-1 text-xs font-bold bg-accent-pink/20 text-accent-pink rounded-full">
                                        Coming Soon
                                    </div>
                                    <h4 className="font-bold text-lg text-accent-cyan">{game.name}</h4>
                                    <p className="text-sm text-gray-400 flex-1">{game.description}</p>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                ))}
            </div>
        </div>
    );
}
