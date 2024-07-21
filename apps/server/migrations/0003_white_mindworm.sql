CREATE TABLE `seat_transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`seat_id` text NOT NULL,
	`to_tr_id` text,
	`from_tr_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`transfer_accept_id` text NOT NULL,
	FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_tr_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_tr_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD `is_transfered` integer;