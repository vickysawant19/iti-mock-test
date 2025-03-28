/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["sans", "sans-serif"], // Default sans-serif font
        marathi: ["Noto Sans Devanagari", "sans-serif"], // Marathi font
        hindi: ["Noto Sans Devanagari", "sans-serif"], // Hindi font
      },
      lineClamp: {
        2: "2",
      },
    },
  },
  plugins: [],
};
