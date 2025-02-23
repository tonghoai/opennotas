// https://nuxt.com/docs/api/configuration/nuxt-config
import svgLoader from "vite-svg-loader";

export default defineNuxtConfig({
  runtimeConfig: {
    env: "",
    public: {
      env: "",
      version: require("./package.json").version,
      ga: "",
    },
  },

  devtools: { enabled: false },

  css: [
    "~/assets/css/main.css",
    "~/assets/css/style.css",
    "~/assets/css/markdown.css",
    "~/assets/css/animation.css",
    "~/assets/css/codemirror.css",
  ],

  postcss: {
    plugins: {
      "postcss-import": {},
      "tailwindcss/nesting": {},
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  app: {
    head: {
      title: "OpenNotas",
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, Interactive-widget=resizes-content, shrink-to-fit=no",
        },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "msapplication-starturl", content: "/app" },
      ],
      link: [
        { hid: "icon", rel: "icon", type: "image/png", href: "/logo-icon.png" },
        {
          hid: "apple-touch-icon",
          rel: "apple-touch-icon",
          href: "/apple-touch-icon-180x180.png",
        },
        { rel: "manifest", href: "/manifest.json" },
      ],
      script: [
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/interact.js/1.10.27/interact.min.js",
        },
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js",
        },
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/FlexSearch/0.7.31/flexsearch.bundle.js",
        },
      ],
    },
  },

  vite: {
    plugins: [svgLoader({})],
  },

  modules: ["@nuxtjs/color-mode", "@nuxtjs/tailwindcss", "@nuxtjs/i18n"],

  i18n: {
    vueI18n: "./i18n.config.ts",
  },

  colorMode: {
    preference: "light",
    fallback: "light",
    dataValue: "theme",
  },

  compatibilityDate: "2024-11-18",
});