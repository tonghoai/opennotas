/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      borderWidth: {
        3: "3px",
      },
      zIndex: {
        1000: "1000",
      },
    },
  },
  plugins: [require("daisyui"), require("tailwindcss-animated")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#003566",
          "base-300": "#d1d5db",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#003566",
          "base-300": "#374151",
        },
      },
    ],
  },
};
