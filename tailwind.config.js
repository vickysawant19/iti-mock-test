/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans Devanagari", "sans-serif"], // Default sans-serif font
        marathi: ["Noto Sans Devanagari", "sans-serif"], // Marathi font
        hindi: ["Noto Sans Devanagari", "sans-serif"], // Hindi font
      },
    },
  },
  plugins: [],
};
