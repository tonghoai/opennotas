PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
, `lastSync` integer);
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`folderId` text,
	`content` text,
	`isPinned` integer,
	`isLocked` integer,
	`createdAt` integer,
	`updatedAt` integer,
	`deletedAt` integer
, `lastSync` integer, `deleteCompletelyAt` integer);
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`password` text
, `updatedAt` integer, `lastSync` integer);
COMMIT;