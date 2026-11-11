/** @type {import('tailwindcss').Config} */

// Every color resolves to the RGB channels declared in assets/css/ui/tokens.css.
// The `<alpha-value>` placeholder keeps Tailwind opacity modifiers working,
// e.g. `text-foreground/60`, `border-danger/20`.
const token = (name) => `rgb(var(--ui-${name}) / <alpha-value>)`;

export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./composables/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./utils/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
    "./nuxt.config.{js,ts}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
          hover: token("primary-hover"),
          active: token("primary-active"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
          hover: token("secondary-hover"),
          active: token("secondary-active"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        subtle: token("subtle"),
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        danger: {
          DEFAULT: token("danger"),
          foreground: token("danger-foreground"),
        },
        success: {
          DEFAULT: token("success"),
          foreground: token("success-foreground"),
        },
        warning: {
          DEFAULT: token("warning"),
          foreground: token("warning-foreground"),
        },
        info: {
          DEFAULT: token("info"),
          foreground: token("info-foreground"),
        },
        neutral: {
          DEFAULT: token("neutral"),
          foreground: token("neutral-foreground"),
        },
        selection: token("selection"),
        selected: {
          DEFAULT: token("selected"),
          foreground: token("selected-foreground"),
          border: token("selected-border"),
        },
        sidebar: {
          DEFAULT: token("sidebar"),
          foreground: token("sidebar-foreground"),
          border: token("sidebar-border"),
          accent: token("sidebar-accent"),
          active: token("sidebar-active"),
          "active-foreground": token("sidebar-active-foreground"),
        },
      },
      borderRadius: {
        ui: "var(--ui-radius)",
        "ui-lg": "var(--ui-radius-lg)",
      },
      fontFamily: {
        // Body typography is set in assets/css/ui/base.css (IBM Plex Sans).
        // Only expose the mono utility to Tailwind.
        mono: ["var(--ui-font-mono)"],
      },
      boxShadow: {
        DEFAULT: "var(--ui-shadow-sm)",
        sm: "var(--ui-shadow-sm)",
        md: "var(--ui-shadow-md)",
        lg: "var(--ui-shadow-lg)",
      },
      borderWidth: {
        3: "3px",
      },
      zIndex: {
        1000: "1000",
      },
    },
  },
  plugins: [require("tailwindcss-animated")],
};
