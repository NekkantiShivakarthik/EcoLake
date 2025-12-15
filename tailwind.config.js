/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E7490',
          light: '#22D3EE',
          dark: '#0C4A6E',
        },
        secondary: {
          DEFAULT: '#059669',
          light: '#34D399',
          dark: '#065F46',
        },
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
}
