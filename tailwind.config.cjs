/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  darkMode: "media",
  daisyui: {
    themes: ["light", "dark"],
  },
};
