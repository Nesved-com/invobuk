/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Matches the sidebar / New Invoice redesign exactly (Claude Design project
        // "Billing Software Invoice Redesign") — 900 is the sidebar's own background.
        brand: {
          50:  '#ECFBF3',
          100: '#E7F3EC',
          200: '#BEE3CF',
          300: '#8FC9AE',
          400: '#4FD6A0',
          500: '#28C384',
          600: '#13A26A',
          700: '#0F7A52',
          800: '#0B6B47',
          900: '#0C1714',
        },
        amber: {
          50:  '#fffbeb',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
