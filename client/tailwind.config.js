/** @type {import('tailwindcss').Config} */
const gold = {
  50: '#fbf6e3', 100: '#f6ebc0', 200: '#efdc92', 300: '#e6c867', 400: '#dab244',
  500: '#c9a227', 600: '#a8851d', 700: '#866a17', 800: '#654f12', 900: '#44350c', DEFAULT: '#c9a227',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#08121f', 900: '#0d1b2a', 800: '#12263f', 700: '#1a3558', 600: '#254a78',
          500: '#3a6fa8', 400: '#7fa6d6', 300: '#b4cdea', 200: '#d6e4f5', 100: '#eaf1fb',
        },
        gold,
        primary: gold, // any leftover "primary-*" class renders in gold
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { gold: '0 8px 30px rgba(201,162,39,0.25)', card: '0 4px 24px rgba(0,0,0,0.25)' },
      keyframes: {
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: { 'slide-up': 'slide-up .25s ease-out', 'fade-in': 'fade-in .3s ease-out' },
    },
  },
  plugins: [],
}
