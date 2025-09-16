
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Video, MapPin, Brain, Bot, ArrowLeft } from 'lucide-react';
import { TrendChase } from './games/TrendChase';
import { FlashPollWars } from './games/FlashPollWars';
import { SquadQuests } from './games/SquadQuests';
import { TapTheVibe } from './games/TapTheVibe';
import { FlixSwipe } from './games/FlixSwipe';
import { SpotTheFake } from './games/SpotTheFake';
import { RadarHunt } from './games/RadarHunt';
import { GeoVibes } from './games/GeoVibes';
import { CaptionClash } from './games/CaptionClash';
import { VibePuzzle } from './games/VibePuzzle';
import { EmojiDecode } from './games/EmojiDecode';
import { AIRoastBattle } from './games/AIRoastBattle';
import { DailyAlmightyChallenge } from './games/DailyAlmightyChallenge';
import { AIVsYou } from './games/AIVsYou';

const gameCategories = [
    {
        title: "Social & Interactive",
        icon: <Users className="text-accent-pink"/>,
        games: [
            { id: 'trend-chase', name: "Trend Chase", description: "Quickly pick the real trending vibe (post) out of fake ones. Compete with friends.", component: TrendChase },
            { id: 'flash-poll-wars', name: "Flash Poll Wars", description: "Users get fun polls (“Best song of 2025?”, “This or That vibes?”) and compete to predict which side gets the majority.", component: FlashPollWars },
            { id: 'squad-quests', name: "Squad Quests", description: "A collaborative challenge where a squad (friends/followers) solves short riddles or meme puzzles daily.", component: SquadQuests },
        ]
    },
    {
        title: "Quick Play, TikTok/Shorts Style",
        icon: <Video className="text-accent-cyan"/>,
        games: [
            { id: 'tap-the-vibe', name: "Tap the Vibe", description: "A rhythm game synced with music/audio from posts. Like a mini beat-tap game in the feed.", component: TapTheVibe },
            { id: 'flix-swipe', name: "FlixSwipe", description: "Users swipe fast to match posts with categories (“Music”, “Meme”, “Movie”) before timer ends.", component: FlixSwipe },
            { id: 'spot-the-fake', name: "Spot the Fake", description: "Show two posts; one is AI-generated or fake, the other is real. Guess quick.", component: SpotTheFake },
        ]
    },
    {
        title: "Location & Social Twist",
        icon: <MapPin className="text-accent-green"/>,
        games: [
            { id: 'radar-hunt', name: "Radar Hunt", description: "AR-style treasure hunts where hints are posted as vibes (like your treasure hunt idea for Teachers’ Day, but in-app).", component: RadarHunt },
            { id: 'geo-vibes', name: "Geo Vibes", description: "A game where you unlock badges by vibing from different places (like posting from school, café, etc.).", component: GeoVibes },
        ]
    },
    {
        title: "Brainy & Meme-Driven",
        icon: <Brain className="text-brand-gold"/>,
        games: [
            { id: 'caption-clash', name: "Caption Clash", description: "Show a photo, users submit captions, others vote.", component: CaptionClash },
            { id: 'vibe-puzzle', name: "Vibe Puzzle", description: "A mini image puzzle where trending posts break into tiles, and you solve to unlock it.", component: VibePuzzle },
            { id: 'emoji-decode', name: "Emoji Decode", description: "Guess the movie/song/meme from emojis before others do.", component: EmojiDecode },
        ]
    },
    {
        title: "Future-Forward / Almighty AI Twist",
        icon: <Bot className="text-accent-purple"/>,
        games: [
            { id: 'ai-roast-battle', name: "AI Roast Battle", description: "Almighty throws a funny roast at you; you reply with your roast. Friends vote winner.", component: AIRoastBattle },
            { id: 'daily-almighty-challenge', name: "Daily Almighty Challenge", description: "Almighty gives you a quiz, riddle, or creative prompt. Completing it earns you badges.", component: DailyAlmightyChallenge },
            { id: 'ai-vs-you', name: "AI vs You", description: "A mini trivia duel between Almighty and the user.", component: AIVsYou },
        ]
    }
];

export function GamesHub() {
    const [activeGame, setActiveGame] = useState<React.ComponentType<any> | null>(null);

    const GameComponent = activeGame;

    if (GameComponent) {
        return (
            <div className="w-full flex flex-col items-center">
                <button onClick={() => setActiveGame(null)} className="btn-glass self-start mb-4 flex items-center gap-2">
                    <ArrowLeft size={16}/> Back to Games
                </button>
                <GameComponent />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-8">
                Community Games
            </h2>
            
            <p className="text-center text-gray-400 mb-12 max-w-2xl">
                Get ready for a new era of social gaming! These lightweight, interactive mini-games are built right into the FlixTrend experience. Challenge friends, join quests, and earn rewards.
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
                                <motion.div 
                                    key={game.id} 
                                    className="glass-card p-6 flex flex-col gap-3 hover:border-accent-cyan transition-colors duration-300 cursor-pointer"
                                    whileHover={{ y: -5 }}
                                    onClick={() => setActiveGame(() => game.component)}
                                >
                                    <h4 className="font-bold text-lg text-accent-cyan">{game.name}</h4>
                                    <p className="text-sm text-gray-400 flex-1">{game.description}</p>
                                    <div className="text-right text-xs font-bold text-accent-pink">Play Now &rarr;</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                ))}
            </div>
        </div>
    );
}
