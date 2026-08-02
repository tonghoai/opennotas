CREATE TABLE `note_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`noteId` text,
	`tagId` text,
	`lastSync` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`color` text,
	`lastSync` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
ALTER TABLE settings ADD `schemaVersion` integer;