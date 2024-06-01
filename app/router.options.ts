import type { RouterConfig } from "@nuxt/schema";

export default <RouterConfig>{
  // https://router.vuejs.org/api/interfaces/routeroptions.html#routes
  routes: (_routes) => [
    {
      name: "landing",
      path: "/",
      component: () =>
        import("~/pages/landing/index.vue").then((r) => r.default || r),
    },
    {
      name: "service",
      path: "/service",
      component: () =>
        import("~/pages/service/index.vue").then((r) => r.default || r),
    },
    {
      name: "app",
      path: "/app",
      component: () =>
        import("~/pages/index/index.vue").then((r) => r.default || r),
    },
    {
      name: "install",
      path: "/install",
      component: () =>
        import("~/pages/install/index.vue").then((r) => r.default || r),
    },
    {
      name: "sos",
      path: "/sos",
      component: () =>
        import("~/pages/sos/index.vue").then((r) => r.default || r),
    },
  ],
};
