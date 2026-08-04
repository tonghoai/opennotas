// https://nuxt.com/docs/api/configuration/nuxt-config
import svgLoader from "vite-svg-loader";

export default defineNuxtConfig({
  runtimeConfig: {
    env: "",
    public: {
      env: "",
      version: require("./package.json").version,
      buildId: Date.now(),
      ga: "",
    },
  },

  devtools: { enabled: false },

  css: [
    "~/assets/css/main.css",
    "~/assets/css/style.css",
    "~/assets/css/markdown.css",
    "~/assets/css/codemirror.css",
    "~/assets/css/crepe.css",
    "~/assets/css/animation.css",
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
        { name: "theme-color", content: "transparent", id: "theme-color" },
        {
          "http-equiv": "Content-Security-Policy",
          content: [
            "default-src 'self'",
            // 'unsafe-inline' is required because Nuxt hydrates via an inline <script> whose
            // content differs per render (no static nonce/hash possible from a <meta> tag), and
            // 'unsafe-eval' because Vite's dev HMR runtime relies on it. script-src is still
            // origin-restricted to self + the pinned cdnjs libraries below, plus Google Tag
            // Manager (loaded from utils/gtag.ts in production) and Cloudflare Web Analytics'
            // beacon (auto-injected at the edge), which is what actually stops an XSS payload
            // from pulling in an arbitrary third-party script.
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://www.googletagmanager.com https://static.cloudflareinsights.com",
            // Tailwind/inline :style bindings throughout the app rely on inline styles; there's
            // no practical way to hash/nonce every one of them.
            // The app lets users pick a Google Font, loaded dynamically as a <link> stylesheet
            // (pages/index/index.vue changeFontFamily) — needs fonts.googleapis.com/gstatic.com.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            // Notes can reference arbitrary http(s) image URLs, pasted data: URIs, blob: object
            // URLs, and the app's own opennotas:// image scheme.
            "img-src 'self' data: blob: https: opennotas:",
            // Sync/S3/image-proxy endpoints are user-configured in Settings, so the destination
            // host isn't known ahead of time.
            "connect-src 'self' https:",
            "object-src 'none'",
            "base-uri 'self'",
            // frame-ancestors is intentionally omitted here — browsers ignore it when delivered
            // via <meta>; it would need to be set as a real HTTP response header to take effect.
          ].join('; '),
        },
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
          integrity: "sha512-U7pxMz47PpFp2XkN2CrzPoILVGEwb6dN0o0/gcz6wserNSwnprr4YoVd5QHHWHVVSA+5gCxeh0yZDVy28T91nQ==",
          crossorigin: "anonymous",
        },
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js",
          integrity: "sha512-UXumZrZNiOwnTcZSHLOfcTs0aos2MzBWHXOHOuB0J/R44QB0dwY5JgfbvljXcklVf65Gc4El6RjZ+lnwd2az2g==",
          crossorigin: "anonymous",
        },
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/FlexSearch/0.8.2/flexsearch.bundle.min.js",
          integrity: "sha512-cWcaktgGI2oRPGH28X0UB9WwbT7c6duyxLwCmmd15YPGNGy3rESrYXTZkhi+T5SAbaqbXE272cE0O1uX3u4m4A==",
          crossorigin: "anonymous",
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