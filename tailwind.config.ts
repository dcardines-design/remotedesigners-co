import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'dm-sans': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#667eea',
          700: '#764ba2',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(160deg, #667eea 0%, #764ba2 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'wave': 'wave 2.5s ease-in-out infinite',
        'wiggle': 'wiggle 2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite',
        'modal-bounce': 'modal-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'modal-fade-1': 'modal-fade 0.4s ease-out 0.2s forwards',
        'modal-fade-2': 'modal-fade 0.4s ease-out 0.3s forwards',
        'modal-fade-3': 'modal-fade 0.4s ease-out 0.4s forwards',
        'modal-fade-4': 'modal-fade 0.4s ease-out 0.5s forwards',
        'modal-fade-5': 'modal-fade 0.4s ease-out 0.6s forwards',
        'check-draw': 'check-draw 0.4s ease-out 0.4s forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)',
          },
          '50%': {
            boxShadow: '0 0 8px 4px rgba(34, 197, 94, 0.6)',
          },
        },
        'wave': {
          '0%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '60%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '15%': { transform: 'translateY(-6px)' },
          '30%': { transform: 'translateY(0)' },
          '45%': { transform: 'translateY(-3px)' },
          '60%': { transform: 'translateY(0)' },
        },
        'modal-bounce': {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'modal-fade': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'check-draw': {
          '0%': { strokeDashoffset: '50' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
