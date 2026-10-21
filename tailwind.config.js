ssssss2d22wdqdddj/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        nyari: {
          mint: '#E8F8F5',
          teal: '#0D9488',
          darkTeal: '#0F766E',
          navy: '#0F172A',
          slate: '#475569',
          gold: '#D97706',
          cream: '#FFFDF0',
          red: '#EF4444',
        },
      },
    },
  },

  plugins: [],
};