import React from 'react';

export const FlixFlameIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="100"
        height="100"
        {...props}
    >
        <style>
            {`
                @keyframes tinder-pulse {
                    0% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.1); filter: brightness(1.1); }
                    100% { transform: scale(1); filter: brightness(1); }
                }
                .flix-flame-animated {
                    transform-origin: center;
                    animation: tinder-pulse 1.5s ease-in-out infinite;
                }
            `}
        </style>
        <defs>
            {/* Diagonal gradient matching the official Tinder aesthetic */}
            <linearGradient id="flixFlameGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FD297B" />
                <stop offset="50%" stopColor="#FF5864" />
                <stop offset="100%" stopColor="#FF655B" />
            </linearGradient>
        </defs>
        <g className="flix-flame-animated">
            <path
                d="M18.918 8.174c2.56 4.982 .501 11.656 -5.38 12.626c-7.702 1.687 -12.84 -7.716 -7.054 -13.229c.309 -.305 1.161 -1.095 1.516 -1.349c0 .528 .27 3.475 1 3.167c3 0 4 -4.222 3.587 -7.389c2.7 1.411 4.987 3.376 6.331 6.174z"
                fill="url(#flixFlameGradient)"
            />
            {/* Internal highlight path for depth */}
            <path
                d="M12 18.5c-2.5 0-4-2-4-4.5 0-1.5.5-3 1.5-4 .5 1 1.5 2 2.5 2s1.5-1.5 1-3.5c1.5 1 2.5 2.5 2.5 4.5 0 2.5-1.5 5.5-3.5 5.5z"
                fill="#FFFFFF"
                fillOpacity="0.2"
            />
        </g>
    </svg>
);
