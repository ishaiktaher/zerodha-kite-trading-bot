/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all React files
    "./public/index.html", // Include HTML file
  ],
  theme: {
    extend: {}, // Customize colors/fonts here
  },
  plugins: [], // Add plugins if needed
};
