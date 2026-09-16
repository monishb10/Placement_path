CREATE TABLE `auth_sessions` (
	`session_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_sessions_expiry_idx` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `github_users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`github_id` text NOT NULL,
	`login` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_users_github_id_unique` ON `github_users` (`github_id`);--> statement-breakpoint
CREATE TABLE `oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`challenge` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `oauth_states_expiry_idx` ON `oauth_states` (`expires_at`);--> statement-breakpoint
ALTER TABLE `github_connections` ADD `repository` text DEFAULT 'Muthudeenathayalan/DSA' NOT NULL;--> statement-breakpoint
ALTER TABLE `github_connections` ADD `github_id` text;--> statement-breakpoint
ALTER TABLE `github_connections` ADD `github_login` text;--> statement-breakpoint
ALTER TABLE `github_saves` ADD `repository` text DEFAULT 'Muthudeenathayalan/DSA' NOT NULL;