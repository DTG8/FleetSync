/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkCard: '#1e293b',
        darkBorder: '#334155',
        primary: '#6366f1', // Indigo Accent
        secondary: '#a855f7', // Purple Accent
        success: '#10b981', // Emerald
        danger: '#ef4444', // Red
        warning: '#f59e0b', // Amber
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
