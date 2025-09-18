
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Zap, Swords, Puzzle, Film, Search, Trophy, Check, Send } from 'lucide-react';

const mockSquad = [
    { name: "VibeMaster22", avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=vibemaster`, role: "Solver" },
    { name: "CreativeCat", avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=creative`, role: "Creator" },
    { name: "ScoutSupreme", avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=scout`, role: "Scout" },
    { name: "Flex", avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=flex`, role: "Flex" },
];

const mockRivalSquads = [
    { name: "The Trendsetters", score: 12500, avatar: `https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=squad1` },
    { name: "Vibe Raiders", score: 11200, avatar: `https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=squad2` },
    { name: "Meme Lords", score: 9800, avatar: `https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=squad3` },
];

const initialQuest = {
    title: "The Meme-lennial Falcon",
    description: "A three-part quest to test your squad's wit, creativity, and speed. Complete it faster than rival squads to claim victory!",
    stages: [
        {
            title: "Stage 1: The Riddle of the Sphinx",
            icon: <Puzzle className="text-accent-purple" />,
            task: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
            answer: "a map",
            type: "riddle",
            status: 'in_progress',
            submission: ""
        },
        {
            title: "Stage 2: The 15-Second Film Fest",
            icon: <Film className="text-accent-pink" />,
            task: "Create a 15-second vibe that summarizes your favorite movie, but without using any dialogue from it.",
            type: "creative",
            status: 'locked',
            submission: null
        },
        {
            title: "Stage 3: The Hidden Vibe",
            icon: <Search className="text-accent-green" />,
            task: "Find a post from yesterday that has exactly 7 likes and the hashtag #retro.",
            type: "hunt",
            status: 'locked',
            submission: ""
        }
    ]
};

function QuestStage({ stage, index, onStageComplete }: { stage: any, index: number, onStageComplete: (stageIndex: number, submission: any) => void }) {
    const [submission, setSubmission] = useState('');
    const [error, setError] = useState('');

    const handleSubmission = () => {
        setError('');
        if (stage.type === 'riddle') {
            if (submission.toLowerCase().trim() === stage.answer) {
                onStageComplete(index, submission);
            } else {
                setError('Not quite, try again!');
                setTimeout(() => setError(''), 2000);
            }
        } else if (stage.type === 'hunt') {
            // This is a simplified check for MVP
            if (submission.includes('flixtrend.app/post/') || submission.includes('localhost:3000/post/')) {
                onStageComplete(index, submission);
            } else {
                setError('That doesn\'t look like a valid post URL.');
                 setTimeout(() => setError(''), 2000);
            }
        }
    };

    const isLocked = stage.status === 'locked';
    const isCompleted = stage.status === 'completed';

    return (
        <motion.div
            className={`glass-card p-5 border-l-4 ${isCompleted ? 'border-green-400' : stage.status === 'in_progress' ? 'border-yellow-400' : 'border-gray-600'} ${isLocked ? 'opacity-50' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
        >
            <div className="flex items-start gap-4">
                <div className="text-3xl mt-1">{stage.icon}</div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-accent-cyan">{stage.title}</h3>
                    <p className="text-gray-400 text-sm">{stage.task}</p>
                    
                    {!isLocked && !isCompleted && (
                        <div className="mt-4 flex gap-2">
                             {stage.type === 'creative' ? (
                                <button className="btn-glass bg-accent-pink text-white w-full" onClick={() => alert('This will open the "Create Post" modal with a special quest flag.')}>
                                    Create Your Vibe
                                </button>
                             ) : (
                                <>
                                    <input 
                                        type="text"
                                        value={submission}
                                        onChange={(e) => setSubmission(e.target.value)}
                                        placeholder={stage.type === 'riddle' ? 'Your answer...' : 'Paste post URL...'}
                                        className={`input-glass w-full ${error ? 'border-red-500' : ''}`}
                                    />
                                    <button onClick={handleSubmission} className="btn-glass-icon w-12 h-12 bg-accent-cyan"><Send /></button>
                                </>
                             )}
                        </div>
                    )}
                     {error && <p className="text-red-400 text-xs mt-1 text-left">{error}</p>}
                     {isCompleted && (
                         <div className="mt-2 flex items-center gap-2 text-green-400 font-bold text-sm">
                            <Check /> Completed!
                         </div>
                     )}
                </div>
            </div>
        </motion.div>
    );
}

export function SquadQuests() {
    const [quest, setQuest] = useState(initialQuest);

    const handleStageComplete = (stageIndex: number, submission: any) => {
        const newStages = [...quest.stages];
        // Mark current as complete
        newStages[stageIndex] = { ...newStages[stageIndex], status: 'completed', submission };
        // Unlock next stage if it exists
        if (stageIndex + 1 < newStages.length) {
            newStages[stageIndex + 1] = { ...newStages[stageIndex + 1], status: 'in_progress' };
        }
        setQuest({ ...quest, stages: newStages });
    };

    const progressPercentage = (quest.stages.filter(s => s.status === 'completed').length / quest.stages.length) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl flex flex-col md:flex-row gap-8"
        >
            <div className="flex-1 md:flex-[2] flex flex-col gap-6">
                <div className="glass-card p-6">
                    <h2 className="text-3xl font-headline text-accent-pink mb-2">{quest.title}</h2>
                    <p className="text-gray-400 text-sm mb-4">{quest.description}</p>
                    <div className="w-full h-2 bg-accent-pink/20 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-2 bg-accent-pink rounded-full"
                            initial={{ width: '0%'}}
                            animate={{ width: `${progressPercentage}%`}}
                            transition={{ duration: 0.5, ease: 'easeOut'}}
                        />
                    </div>
                </div>
                
                <div className="flex flex-col gap-4">
                    {quest.stages.map((stage, index) => (
                        <QuestStage key={index} stage={stage} index={index} onStageComplete={handleStageComplete} />
                    ))}
                </div>
            </div>

            <div className="flex-1 md:flex-[1] flex flex-col gap-6">
                <div className="glass-card p-4">
                    <h3 className="flex items-center gap-2 text-xl font-headline font-bold mb-3 text-accent-cyan"><Users /> My Squad</h3>
                    <div className="flex flex-col gap-3">
                        {mockSquad.map(member => (
                            <div key={member.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full bg-black/20" />
                                <div>
                                    <p className="font-bold text-sm">{member.name}</p>
                                    <p className="text-xs text-accent-purple font-semibold">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-card p-4">
                    <h3 className="flex items-center gap-2 text-xl font-headline font-bold mb-3 text-brand-gold"><Trophy /> Rival Squads</h3>
                    <div className="flex flex-col gap-3">
                    {mockRivalSquads.map(squad => (
                            <div key={squad.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                <img src={squad.avatar} alt={squad.name} className="w-10 h-10 rounded-lg bg-black/20" />
                                <div className="flex-1">
                                    <p className="font-bold text-sm">{squad.name}</p>
                                    <p className="text-xs text-brand-gold">{squad.score.toLocaleString()} PTS</p>
                                </div>
                                <button className="btn-glass text-xs px-2 py-1">View</button>
                            </div>
                    ))}
                    </div>
                </div>
                <button className="w-full btn-glass bg-accent-pink text-white font-bold text-lg">Challenge a Squad</button>
            </div>
        </motion.div>
    );
}

    
