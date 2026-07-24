import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

const tagModel = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name"),
  color: text("color"),
  lastSync: integer("lastSync"),
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
  deletedAt: integer("deletedAt"),
});

export default tagModel;
