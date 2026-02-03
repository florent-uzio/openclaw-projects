/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        x: {
          blue: '#1DA1F2',
          black: '#14171A',
          dark: '#15202b',
          darker: '#192734',
        },
      },
    },
  },
  plugins: [],
};
