/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Principal Action
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3aba',
        },
        neutral: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b', // Main Dark UI
          950: '#09090b',
        },
        feedback: {
          success: {
            bg: '#D0F9B6',
            text: '#15803d',
          },
          warning: {
            bg: '#fef9c3',
            text: '#a16207',
          },
          danger: {
            bg: '#fee2e2',
            text: '#b91c1c',
          }
        },
        paper: '#FAF6F0'
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        title: ['Fraunces', 'serif'],
        funnel: ['Fraunces', 'serif'],
        fraunces: ['Fraunces', 'serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
      },
      borderRadius: {
        'card': '12px',
        'input': '8px',
      }
    },
  },
  plugins: [],
}
