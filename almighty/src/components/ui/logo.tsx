import * as React from 'react';

export const AlmightyLogo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#60a5fa" />
      </linearGradient>
    </defs>
    <path
      d="M50,10A40,40,0,1,1,10,50,40,40,0,0,1,50,10M50,2A48,48,0,1,0,98,50,48,48,0,0,0,50,2Z"
      transform="translate(0, 0)"
      fill="url(#logoGradient)"
      fillRule="evenodd"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        dur="10s"
        repeatCount="indefinite"
      />
    </path>
    <path
      d="M50,25 C63.8,25 75,36.2 75,50 C75,63.8 63.8,75 50,75 C36.2,75 25,63.8 25,50 C25,36.2 36.2,25 50,25 Z M50,30 C38.95,30 30,38.95 30,50 C30,61.05 38.95,70 50,70 C61.05,70 70,61.05 70,50 C70,38.95 61.05,30 50,30 Z"
      transform="translate(0, 0)"
      fill="url(#logoGradient)"
      fillRule="nonzero"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="360 50 50"
        to="0 50 50"
        dur="10s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);
