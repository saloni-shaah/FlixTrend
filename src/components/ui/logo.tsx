import * as React from 'react';

export const AlmightyLogo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="heptagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent-cyan)" />
        <stop offset="100%" stopColor="var(--accent-purple)" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Outer heptagon shell with glow */}
    <g style={{ filter: 'url(#glow)' }}>
        <path 
            d="M50 2 L93.3 25 V75 L50 98 L6.7 75 V25 Z"
            fill="none"
            stroke="url(#heptagonGradient)"
            strokeWidth="4"
        >
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="15s"
                repeatCount="indefinite"
            />
        </path>
    </g>

    {/* Inner rotating element */}
    <path 
        d="M50 20 L75 35 V65 L50 80 L25 65 V35 Z"
        fill="url(#heptagonGradient)"
        fillOpacity="0.6"
        stroke="#fff"
        strokeWidth="1"
    >
        <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 50 50"
            to="0 50 50"
            dur="12s"
            repeatCount="indefinite"
        />
        <animate
            attributeName="fill-opacity"
            values="0.6;0.3;0.6"
            dur="4s"
            repeatCount="indefinite"
        />
    </path>
    
     {/* Central pulsing dot */}
    <circle cx="50" cy="50" r="4" fill="#fff">
        <animate
            attributeName="r"
            values="4;6;4"
            dur="2s"
            repeatCount="indefinite"
        />
         <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="2s"
            repeatCount="indefinite"
        />
    </circle>
  </svg>
);
