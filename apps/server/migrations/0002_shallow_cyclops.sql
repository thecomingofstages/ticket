CREATE UNIQUE INDEX `users_line_uid_unique` ON `users` (`line_uid`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `verified`;