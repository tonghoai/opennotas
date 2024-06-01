import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

const settingModel = sqliteTable("settings", {
  id: text("id").primaryKey(),
  password: text("password"),
  lastSync: integer("lastSync"),
  updatedAt: integer("updatedAt"),
});

export default settingModel;
