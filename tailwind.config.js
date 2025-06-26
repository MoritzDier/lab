/** @type {import('tailwindcss').Config} */
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
    ...defaultTheme.colors,
    'green-200': '#bbf7d0',
    'blue-200': '#bfdbfe',
    primary: "#000",
    secondary: "#fff",
  }
}
  },
  plugins: [],
};
