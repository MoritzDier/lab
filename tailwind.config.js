@type {import('tailwindcss').Config}
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  prefix: 'tw-',
  important: false,
  content: [
    "**/*.{html,jsx,js}",
    "**/*.js",
    "**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        ...defaultTheme.colors, // 🟢 hier aktivierst du die Standardfarben
        primary: "#000",
        secondary: "#fff",
      },
    },
  },
  plugins: [],
};
