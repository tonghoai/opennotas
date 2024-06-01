CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`folderId` text,
	`content` text,
	`isPinned` integer,
	`isLocked` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
);
