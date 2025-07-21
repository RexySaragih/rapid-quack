/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        game: {
          background: '#1a1a2e',
          accent: '#16213e',
          highlight: '#0f3460',
        }
      },
      fontFamily: {
        'game': ['Orbitron', 'monospace'],
      }
    },
  },
  plugins: [],
} 