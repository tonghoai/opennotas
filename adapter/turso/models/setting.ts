import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

const settingModel = sqliteTable("settings", {
  id: text("id").primaryKey(),
  password: text("password"),
  lastSync: integer("lastSync"),
  updatedAt: integer("updatedAt"),
  schemaVersion: integer("schemaVersion"),
});

export default settingModel;
