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
  theme: {
    extend: {
      colors: {
        "base-400": "var(--base-400)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "primary": "oklch(0.205 0 0)",
          "primary-content": "oklch(0.985 0 0)",
          "secondary": "oklch(0.97 0 0)",
          "secondary-content": "oklch(0.205 0 0)",
          "base-content": "oklch(0.145 0 0)",
          "base-300": "oklch(0.92 0.00 0)",
          "base-200": "oklch(0.97 0.00 0)",
          "base-100": "oklch(0.99 0.00 0)",
          "neutral": "oklch(0.205 0 0)",
          "neutral-content": "oklch(0.985 0 0)",
          "--base-400": "oklch(0.92 0.00 0)",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "oklch(0.922 0 0)",
          "primary-content": "oklch(0.205 0 0)",
          "secondary": "oklch(0.269 0 0)",
          "secondary-content": "oklch(0.985 0 0)",
          "base-content": "oklch(0.985 0 0)",
          "base-300": "oklch(0.14 0.00 0)",
          "base-200": "oklch(0.20 0.00 0)",
          "base-100": "oklch(0.27 0.00 0)",
          "neutral": "oklch(0.922 0 0)",
          "neutral-content": "oklch(0.205 0 0)",
          "--base-400": "#001104",
        },
      },
    ],
  },
};
