/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        fadeInOut: {
          '0%':  { opacity: '0', transform: 'translateY(-6px)' },
          '12%': { opacity: '1', transform: 'translateY(0)' },
          '78%': { opacity: '1', transform: 'translateY(0)' },
          '100%':{ opacity: '0', transform: 'translateY(-6px)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInPanel: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-out':    'fadeInOut 2.2s ease forwards',
        'slide-in-right': 'slideInRight 220ms ease-out',
        'slide-in-left':  'slideInLeft 220ms ease-out',
        'slide-down':     'slideDown 200ms ease-out',
        'slide-in-panel': 'slideInPanel 280ms ease-out',
      },
    },
  },
  plugins: [],
}
