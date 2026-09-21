CREATE TABLE `ledger_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`document` text NOT NULL,
	`updated_at` text NOT NULL
);
