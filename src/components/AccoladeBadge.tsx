
"use client";
import React from 'react';
import { Trophy, Users, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const accoladeData = {
    top_1_follower: {
        icon: <Trophy className="text-yellow-400" />,
        label: "Top Followed",
        description: "Rank #1 on the follower leaderboards.",
        color: "border-yellow-400/50 bg-yellow-400/10 text-yellow-400",
    },
    top_2_follower: {
        icon: <Trophy className="text-gray-300" />,
        label: "Top Followed",
        description: "Rank #2 on the follower leaderboards.",
        color: "border-gray-400/50 bg-gray-400/10 text-gray-300",
    },
    top_3_follower: {
        icon: <Trophy className="text-orange-400" />,
        label: "Top Followed",
        description: "Rank #3 on the follower leaderboards.",
        color: "border-orange-400/50 bg-orange-400/10 text-orange-400",
    },
    social_butterfly: {
        icon: <Users className="text-blue-400" />,
        label: "Social Butterfly",
        description: "Reached over 50 followers.",
        color: "border-blue-400/50 bg-blue-400/10 text-blue-400",
    },
    vibe_starter: {
        icon: <Sparkles className="text-accent-pink" />,
        label: "Vibe Starter",
        description: "Posted for the first time.",
        color: "border-accent-pink/50 bg-accent-pink/10 text-accent-pink",
    }
};

type AccoladeType = keyof typeof accoladeData;

export function AccoladeBadge({ type }: { type: AccoladeType }) {
    const badge = accoladeData[type];

    if (!badge) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-bold ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="glass-card">
                    <p>{badge.description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
