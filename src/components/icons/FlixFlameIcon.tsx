
import React from 'react';

export const FlixFlameIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        {...props}
    >
        <defs>
            <linearGradient id="flixFlameGradient" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#FF86A2" />
                <stop offset="100%" stopColor="#FFC27C" />
            </linearGradient>
        </defs>
        <path
            d="M12.0001 2.5C8.20008 5.625 6.50008 9.375 6.50008 12.375C6.50008 18.375 12.0001 21.5 12.0001 21.5C12.0001 21.5 17.5001 18.375 17.5001 12.375C17.5001 9.375 15.8001 5.625 12.0001 2.5Z"
            fill="url(#flixFlameGradient)"
            strokeWidth="1.5"
            stroke="#FFFFFF"
            strokeOpacity="0.3"
        />
        <path
            d="M12.0001 5.5C10.5001 7.25 9.50008 9.25 9.50008 12.375C9.50008 16.25 12.0001 19 12.0001 19"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
        />
    </svg>
);
