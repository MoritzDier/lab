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
    primary: "#000",
    secondary: "#fff",
  }
}
  },
  plugins: [],
};
