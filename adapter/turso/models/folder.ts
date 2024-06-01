import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

const folderModel = sqliteTable("folders", {
  id: text("id").primaryKey(),
  name: text("name"),
  lastSync: integer("lastSync"),
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
  deletedAt: integer("deletedAt"),
});

export default folderModel;
