CREATE TABLE `staff_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `seats` ADD `check_in_at` integer;