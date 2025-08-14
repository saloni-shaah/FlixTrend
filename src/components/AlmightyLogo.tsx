export function AlmightyLogo({ size = 56 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-purple)" />
            <stop offset="100%" stopColor="var(--accent-pink)" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#glow)">
          <path
            d="M50 10 C 27.9 10, 10 27.9, 10 50 C 10 72.1, 27.9 90, 50 90"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M50 10 C 72.1 10, 90 27.9, 90 50 C 90 72.1, 72.1 90, 50 90"
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="100 25"
          />
          <circle cx="50" cy="50" r="12" fill="url(#logoGradient)" />
        </g>
      </svg>
    </div>
  );
}
