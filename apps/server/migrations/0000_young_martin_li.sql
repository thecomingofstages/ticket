CREATE TABLE `seats` (
	`id` text PRIMARY KEY NOT NULL,
	`round` integer NOT NULL,
	`transaction_id` text,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`round` integer NOT NULL,
	`created_at` integer NOT NULL,
	`submitted_at` integer NOT NULL,
	FOREIGN KEY (`uid`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`department` text NOT NULL,
	`line_uid` text,
	`verified` integer NOT NULL
);
