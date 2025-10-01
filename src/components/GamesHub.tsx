
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft, Construction } from 'lucide-react';
import { VibeJumper } from '@/components/games/VibeJumper';
import { OfflineDinoRun } from '@/components/games/OfflineDinoRun';
import { SnakeAndLadder } from '@/components/games/SnakeAndLadder';
import { ChessGame } from '@/components/games/Chess';
import { FlashMatch } from '@/components/games/FlashMatch';
import { ScopeSlider } from '@/components/games/ScopeSlider';
import { EchoChamber } from '@/components/games/EchoChamber';
import { GlitchGrid } from '@/components/games/GlitchGrid';
import { TrendRider } from '@/components/games/TrendRider';
import { MemeMakerOffline } from '@/components/games/MemeMakerOffline';
import { WordVibe } from '@/components/games/WordVibe';
import { StackEm } from '@/components/games/StackEm';
import { ColorFlood } from '@/components/games/ColorFlood';
import { EmojiInvaders } from '@/components/games/EmojiInvaders';
import { VibePinball } from '@/components/games/VibePinball';
import { HeptagonFall } from '@/components/games/HeptagonFall';
import { TapTitan } from '@/components/games/TapTitan';
import { PixelPerfect } from '@/components/games/PixelPerfect';
import { ProfilePicPuzzle } from '@/components/games/ProfilePicPuzzle';
import { SoundWaveSurfer } from '@/components/games/SoundWaveSurfer';
import { MazeRunner } from '@/components/games/MazeRunner';
import { TrendChase } from '@/components/games/TrendChase';
import { AlmightyRiddle } from '@/components/games/AlmightyRiddle';
import { CaptionThis } from '@/components/games/CaptionThis';
import { EmojiStory } from '@/components/games/EmojiStory';
import { AIVibeCheck } from '@/components/games/AIVibeCheck';
import { TicTacToeAI } from '@/components/games/TicTacToeAI';
import { AIArtCritic } from '@/components/games/AIArtCritic';
import { LyricFinisher } from '@/components/games/LyricFinisher';
import { StoryWeaver } from '@/components/games/StoryWeaver';
import { WhatAmI } from '@/components/games/WhatAmI';
import { VibeSpaceDraw } from '@/components/games/VibeSpaceDraw';
import { SignalChessOnline } from '@/components/games/SignalChessOnline';
import { SquadQuiz } from '@/components/games/SquadQuiz';
import { FlashBattles } from '@/components/games/FlashBattles';
import { ConnectFourLive } from '@/components/games/ConnectFourLive';
import { HashtagWars } from '@/components/games/HashtagWars';
import { MemeRoyale } from '@/components/games/MemeRoyale';
import { TypeRace } from '@/components/games/TypeRace';
import { LyricShowdown } from '@/components/games/LyricShowdown';
import { PollRoyale } from '@/components/games/PollRoyale';
import { UnfairPlatformer } from '@/components/games/UnfairPlatformer';
import { HeptagonHell } from '@/components/games/HeptagonHell';
import { VibeJumperNightmare } from '@/components/games/VibeJumperNightmare';
import { LongestRoad } from '@/components/games/LongestRoad';
import { MemoryOverload } from '@/components/games/MemoryOverload';
import { ZenGarden } from '@/components/games/ZenGarden';
import { MusicBox } from '@/components/games/MusicBox';
import { PixelPad } from '@/components/games/PixelPad';
import { VibeComposer } from '@/components/games/VibeComposer';
import { QuoteDesigner } from '@/components/games/QuoteDesigner';


const ComingSoonComponent = () => (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4">
        <Construction size={64} className="text-accent-cyan mb-4" />
        <h2 className="text-3xl font-headline font-bold text-accent-cyan">Coming Soon!</h2>
        <p className="text-gray-400 mt-2">This game is under construction. Check back later!</p>
    </div>
);


// This will be the list of all our games
const gamesList = [
    // Existing Games
    { id: 'vibe-jumper', name: 'Vibe Jumper', component: VibeJumper, description: "An endless jumper where you hop on trending hashtag clouds." },
    { id: 'offline-dino-run', name: 'Offline Dino Run', component: OfflineDinoRun, description: "The classic offline game, but with the FlixTrend logo." },
    { id: 'snake-and-ladder', name: 'Snake & Ladder', component: SnakeAndLadder, description: "Climb the ladders and dodge the snakes in this classic board game." },
    { id: 'chess', name: 'Chess', component: ChessGame, description: "The classic strategy game. Play against a friend locally." },
    { id: 'flash-match', name: 'Flash Match', component: FlashMatch, description: "A fast-paced tile-matching game with brand icons." },
    { id: 'scope-slider', name: 'Scope Slider', component: ScopeSlider, description: "A sliding puzzle game using images from popular posts." },
    { id: 'echo-chamber', name: 'Echo Chamber', component: EchoChamber, description: 'A "Simon Says" memory game with color patterns.' },
    { id: 'glitch-grid', name: 'Glitch Grid', component: GlitchGrid, description: "A 2048-style game with social media icons." },
    // Placeholders
    { id: 'trend-rider', name: 'Trend Rider', component: TrendRider, description: "An endless runner where you dodge obstacles in a neon tunnel." },
    { id: 'meme-maker-offline', name: 'Meme Maker Offline', component: MemeMakerOffline, description: "A simple meme generator with pre-loaded templates." },
    { id: 'word-vibe', name: 'Word Vibe', component: WordVibe, description: "A Wordle-style game with 5-letter Gen-Z slang words." },
    { id: 'stack-em', name: "Stack 'Em", component: StackEm, description: "Stack blocks as high as you can before they topple." },
    { id: 'color-flood', name: 'Color Flood', component: ColorFlood, description: "Flood the board with a single color in a limited number of moves." },
    { id: 'emoji-invaders', name: 'Emoji Invaders', component: EmojiInvaders, description: "A Space Invaders clone with falling emojis." },
    { id: 'vibe-pinball', name: 'Vibe Pinball', component: VibePinball, description: "A classic pinball game with a neon, futuristic theme." },
    { id: 'heptagon-fall', name: 'Heptagon Fall', component: HeptagonFall, description: "A Tetris-style game with heptagon-shaped blocks." },
    { id: 'tap-titan', name: 'Tap Titan', component: TapTitan, description: 'A simple "tap as fast as you can" game for 10 seconds.' },
    { id: 'pixel-perfect', name: 'Pixel Perfect', component: PixelPerfect, description: "Recreate a pixel art image from memory." },
    { id: 'profile-pic-puzzle', name: 'Profile Pic Puzzle', component: ProfilePicPuzzle, description: "A jigsaw puzzle made from a user's avatar." },
    { id: 'sound-wave-surfer', name: 'Sound Wave Surfer', component: SoundWaveSurfer, description: "A side-scroller where you ride a music visualizer wave." },
    { id: 'maze-runner', name: 'Maze Runner', component: MazeRunner, description: "Navigate a series of increasingly complex mazes." },
    { id: 'trend-chase', name: 'Trend Chase', component: TrendChase, description: "Spot the real post among AI-generated fakes." },
    { id: 'almighty-riddle', name: "Almighty's Riddle", component: AlmightyRiddle, description: "Solve riddles posed by the Almighty AI." },
    { id: 'caption-this', name: 'Caption This!', component: CaptionThis, description: "Compete against the AI to write the wittiest caption for an image." },
    { id: 'emoji-story', name: 'Emoji Story', component: EmojiStory, description: "The AI gives you 3 emojis, and you write a story. The AI judges it." },
    { id: 'ai-vibe-check', name: 'AI Vibe Check', component: AIVibeCheck, description: "The AI analyzes a phrase and tells you if it's 'on vibe' or not." },
    { id: 'tic-tac-toe-ai', name: 'Tic-Tac-Toe AI', component: TicTacToeAI, description: "A classic game against an unbeatable AI opponent." },
    { id: 'ai-art-critic', name: 'AI Art Critic', component: AIArtCritic, description: "The AI gives you a prompt, you draw something, and the AI 'reviews' it." },
    { id: 'lyric-finisher', name: 'Lyric Finisher', component: LyricFinisher, description: "The AI gives you the first line of a song; you have to finish it." },
    { id: 'story-weaver', name: 'Story Weaver (AI Collab)', component: StoryWeaver, description: "You and the AI take turns writing a story, one sentence at a time." },
    { id: 'what-am-i', name: 'What Am I?', component: WhatAmI, description: "A 20-questions style game where the AI thinks of an object." },
    { id: 'vibespace-draw', name: 'VibeSpace Draw', component: VibeSpaceDraw, description: "A Pictionary-style game where you draw and friends guess." },
    { id: 'signal-chess-online', name: 'Signal Chess (Online)', component: SignalChessOnline, description: "A real-time chess match within a Signal chat." },
    { id: 'squad-quiz', name: 'Squad Quiz', component: SquadQuiz, description: "A live trivia game for you and your mutuals." },
    { id: 'flash-battles', name: 'Flash Battles', component: FlashBattles, description: "Two users submit a 'Flash' on a theme; others vote for the best one." },
    { id: 'connect-four-live', name: 'Connect Four Live', component: ConnectFourLive, description: "A real-time Connect Four game." },
    { id: 'hashtag-wars', name: 'Hashtag Wars', component: HashtagWars, description: "Two players compete to list the most relevant hashtags for a topic." },
    { id: 'meme-royale', name: 'Meme Royale', component: MemeRoyale, description: "A group of players submit memes for a prompt; the winner is voted on." },
    { id: 'type-race', name: 'Type Race', component: TypeRace, description: "See who can type a trending phrase the fastest." },
    { id: 'lyric-showdown', name: 'Lyric Showdown', component: LyricShowdown, description: "A 'Finish the Lyric' game against another player." },
    { id: 'poll-royale', name: 'Poll Royale', component: PollRoyale, description: "Everyone answers a poll, and you see if you're in the majority." },
    { id: 'unfair-platformer', name: 'The Unfair Platformer', component: UnfairPlatformer, description: "A deceptively difficult platformer with hidden traps." },
    { id: 'heptagon-hell', name: 'Heptagon Hell', component: HeptagonHell, description: "An impossibly fast version of Tetris with weird shapes." },
    { id: 'vibe-jumper-nightmare', name: 'Vibe Jumper: Nightmare', component: VibeJumperNightmare, description: "The platforms move, disappear, and trick you." },
    { id: 'longest-road', name: 'The Longest Road', component: LongestRoad, description: "Keep a ball on a winding path that gets faster and faster." },
    { id: 'memory-overload', name: 'Memory Overload', component: MemoryOverload, description: "A memory game with an ever-increasing number of tiles." },
    { id: 'zen-garden', name: 'Zen Garden', component: ZenGarden, description: "A calming sandbox to draw patterns in the sand." },
    { id: 'music-box', name: 'Music Box', component: MusicBox, description: "Create simple melodies on a virtual music box." },
    { id: 'pixel-pad', name: 'Pixel Pad', component: PixelPad, description: "A free-form pixel art canvas." },
    { id: 'vibe-composer', name: 'Vibe Composer', component: VibeComposer, description: "Mix and match pre-made audio loops to create a vibe." },
    { id: 'quote-designer', name: 'Quote Designer', component: QuoteDesigner, description: "Style your favorite quotes with cool fonts and backgrounds." },
];

export function GamesHub() {
    const [selectedGame, setSelectedGame] = useState<any | null>(null);

    const handleSelectGame = (game: any) => {
        setSelectedGame(game);
    };

    if (selectedGame) {
        const GameComponent = selectedGame.component || ComingSoonComponent;
        return (
            <div className="w-full h-[80vh] flex flex-col items-center">
                <button 
                    className="btn-glass self-start mb-4 flex items-center gap-2"
                    onClick={() => setSelectedGame(null)}
                >
                    <ArrowLeft size={16}/> Back to Games
                </button>
                <div className="w-full h-full glass-card overflow-hidden">
                    <GameComponent />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl"
        >
            <div className="text-center mb-12">
                <Gamepad2 size={64} className="mx-auto text-accent-green mb-4" />
                <h2 className="text-4xl font-headline text-accent-green">Games Hub</h2>
                <p className="text-gray-400 mt-2">Your space for offline fun, AI challenges, and multiplayer battles.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gamesList.map(game => (
                    <motion.div 
                        key={game.id}
                        className={`glass-card p-6 flex flex-col items-center text-center transition-all ${!game.component ? 'opacity-50' : 'cursor-pointer hover:border-accent-green'}`}
                        whileHover={game.component ? { y: -5 } : {}}
                        onClick={() => game.component && handleSelectGame(game)}
                    >
                        <Gamepad2 size={40} className={!game.component ? "text-gray-500 mb-3" : "text-accent-green mb-3"}/>
                        <h3 className={`text-xl font-bold font-headline ${!game.component ? 'text-gray-500' : 'text-accent-cyan'}`}>{game.name}</h3>
                        <p className="text-sm text-gray-400 mt-2 flex-1">{game.description}</p>
                        {!game.component && <p className="text-xs font-bold text-accent-purple mt-4">Coming Soon</p>}
                    </motion.div>
                ))}
            </div>

        </motion.div>
    );
}
