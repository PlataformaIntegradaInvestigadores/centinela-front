/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{html,ts}', './node_modules/flowbite/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary_tailwind: '#1E3C8B',
        primary_hover: '#3B5BA0',
        secondary: '#eaebed',
        alert: '#C81E1E',
      },
      maxHeight: {
        100: '580px', // Agrega la clase max-h-100 con un valor de 400px
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [require('flowbite/plugin')],
};
