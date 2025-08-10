import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#BF00FF", // Electric Purple
        secondary: "#0F0F0F", // Midnight Black
        accentPink: "#FF3CAC", // Cyber Pink
        accentCyan: "#00F0FF", // Mint Blue
        accentGreen: "#39FF14", // Neon Green
        accentCoral: "#FF5F6D", // Hot Coral
        softGray: "#C0C0C0", // Soft Gray
        card: "#151515",
        glassWhite: "rgba(255,255,255,0.07)", // Glassmorphism
      },
      boxShadow: {
        'fab-glow': '0 0 20px #BF00FF, 0 0 40px #FF3CAC',
        'neon': '0 0 8px #BF00FF, 0 0 16px #FF3CAC',
        'glass': '0 4px 32px 0 rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        'animated-gradient': 'linear-gradient(270deg, #FF3CAC, #784BA0, #2B86C5)',
      },
      fontFamily: {
        headline: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          '0%, 100%': { textShadow: '0 0 10px #BF00FF' },
          '50%': { textShadow: '0 0 20px #FF3CAC' },
        },
        'gradientFlow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pop': {
          '0%': { transform: 'scale(0.8)' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.8s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 1.5s infinite',
        'gradient-flow': 'gradientFlow 10s ease infinite',
        'pop': 'pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      },
    },
  },
  plugins: [],
};
export default config;
