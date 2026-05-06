/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#e8f4f8',
          100: '#cceaf0',
          200: '#99d4e0',
          300: '#66bfd1',
          400: '#4A90A2',
          500: '#3a7a8a',
          600: '#2d6472',
          700: '#23505c',
          800: '#1c3d47',
          900: '#152d35',
        },
        sage: {
          50: '#eef4ee',
          100: '#dce8dc',
          200: '#c5ddc1',
          300: '#9ec496',
          400: '#8CB08C',
          500: '#6d9a6d',
          600: '#557e55',
          700: '#446544',
          800: '#395139',
          900: '#304330',
        },
        amber: {
          50: '#fdf4e0',
          100: '#f9e8c2',
          200: '#f3d996',
          300: '#ecc45f',
          400: '#D4A855',
          500: '#c4933a',
          600: '#a77a2f',
          700: '#8a6227',
          800: '#70511f',
          900: '#5c4219',
        },
        'dark-bg': '#0f0f1a',
        'dark-card': '#1a1a2e',
        'dark-border': '#2a2a4a',
        'dark-hover': '#222242',
        'dark-text': '#e0e0e0',
        'dark-muted': '#a0a0b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.825rem', { lineHeight: '1.25rem' }],
        'sm': ['0.935rem', { lineHeight: '1.45rem' }],
        'base': ['1.1rem', { lineHeight: '1.65rem' }],
        'lg': ['1.21rem', { lineHeight: '1.75rem' }],
        'xl': ['1.375rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.65rem', { lineHeight: '2.1rem' }],
        '3xl': ['2.05rem', { lineHeight: '2.4rem' }],
      },
      maxWidth: {
        '85': '85%',
        '90': '90%',
        '95': '95%',
      }
    },
  },
  plugins: [],
}
