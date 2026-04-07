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
      },
      animation: {
        'fade-in-out': 'fadeInOut 2.2s ease forwards',
      },
    },
  },
  plugins: [],
}
