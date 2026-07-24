import type { Config } from "drizzle-kit";

export default {
  schema: "../../adapter/turso/models",
  out: "../../adapter/turso/migrations",
  driver: "turso",
  dbCredentials: {
    url: "",
    authToken: "",
  },
} satisfies Config;
