CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`password` text
);
--> statement-breakpoint
ALTER TABLE `folders` DROP COLUMN `deleteCompletelyAt`;