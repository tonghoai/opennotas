import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

const noteModel = sqliteTable("notes", {
  id: text("id").primaryKey(),
  folderId: text("folderId"),
  content: text("content"),
  isPinned: integer("isPinned"),
  isLocked: integer("isLocked"),
  lastSync: integer("lastSync"),
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
  deletedAt: integer("deletedAt"),
  deleteCompletelyAt: integer("deleteCompletelyAt"),
});

export default noteModel;
