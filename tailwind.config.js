/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-space': '#1A1A2E',
        'deep-space-light': '#252542',
        'deep-space-dark': '#12121F',
        'rose-gold': '#D4A574',
        'rose-gold-light': '#E5C4A0',
        'rose-gold-dark': '#B88A5C',
        'ivory': '#F5F0E8',
        'ivory-dark': '#E8E0D0',
        'slate-blue': '#4A6670',
        'matcha': '#7D8471',
        'warm-gold': '#C9A961',
        'warm-gold-light': '#DBC080',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.8s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
      boxShadow: {
        'luxury': '0 8px 32px rgba(212, 165, 116, 0.15)',
        'luxury-hover': '0 12px 40px rgba(212, 165, 116, 0.25)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
