CREATE TABLE `github_connections` (
	`user_id` text PRIMARY KEY NOT NULL,
	`encrypted_token` text NOT NULL,
	`branch` text NOT NULL,
	`updated_at` text NOT NULL,
	`lock_id` text,
	`lock_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `github_saves` (
	`user_id` text NOT NULL,
	`task_id` text NOT NULL,
	`source_hash` text NOT NULL,
	`blob_sha` text NOT NULL,
	`file_url` text NOT NULL,
	`commit_url` text,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `task_id`)
);
