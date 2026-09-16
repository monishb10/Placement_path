CREATE TABLE `coding_attempts` (
	`user_id` text NOT NULL,
	`task_id` text NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`accepted` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `task_id`)
);
