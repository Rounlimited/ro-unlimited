import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ro: {
          black: '#1A1A1A',
          gold: '#C9A84C',
          'gold-light': '#D4B965',
          'gold-dark': '#A88A3D',
          white: '#FFFFFF',
          gray: {
            100: '#F5F5F5', 200: '#E5E5E5', 300: '#D4D4D4', 400: '#A3A3A3',
            500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717',
          },
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        craneSwing: { '0%, 100%': { transform: 'rotate(-5deg)' }, '50%': { transform: 'rotate(5deg)' } },
        beamDrop: {
          '0%': { transform: 'translateY(-100vh) rotate(5deg)', opacity: '0' },
          '60%': { transform: 'translateY(10px) rotate(-1deg)', opacity: '1' },
          '100%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
        },
        wallRise: {
          '0%': { transform: 'translateY(100%) scaleY(0)', opacity: '0' },
          '100%': { transform: 'translateY(0) scaleY(1)', opacity: '1' },
        },
        boltIn: {
          '0%': { transform: 'scale(0) rotate(180deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        progressFill: { '0%': { width: '0%' }, '100%': { width: '100%' } },
      },
      animation: {
        'crane-swing': 'craneSwing 4s ease-in-out infinite',
        'beam-drop': 'beamDrop 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'wall-rise': 'wallRise 1s cubic-bezier(0.22,1,0.36,1) forwards',
        'bolt-in': 'boltIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55) forwards',
        'progress-fill': 'progressFill 2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;
