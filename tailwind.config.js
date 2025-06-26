/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors') // ⬅ Standardfarben importieren

module.exports = {
	prefix: 'tw-',
	important: false,
	content: [
		"**/*.{html,jsx,js}", // HTML & JS-Dateien
	],
	theme: {
		colors: {
			...colors, // ⬅ Alle Standardfarben (z. B. blue-200, green-500 etc.)
			primary: "#000",    // Deine eigene Farbe
			secondary: "#fff",  // Deine eigene Farbe
		},
		extend: {
			// Weitere Erweiterungen (Abstände, Fonts etc.) kannst du hier später ergänzen
		}
	},
	plugins: [],
}
