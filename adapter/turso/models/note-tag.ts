import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

const noteTagModel = sqliteTable("note_tags", {
  id: text("id").primaryKey(), // `${noteId}:${tagId}`
  noteId: text("noteId"),
  tagId: text("tagId"),
  lastSync: integer("lastSync"),
  createdAt: integer("createdAt"),
  updatedAt: integer("updatedAt"),
  deletedAt: integer("deletedAt"),
});

export default noteTagModel;
