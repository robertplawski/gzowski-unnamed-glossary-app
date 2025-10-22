PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comment` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`user_id` text NOT NULL,
	`text` text NOT NULL,
	`image` text,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comment`("id", "entry_id", "user_id", "text", "image", "score", "created_at", "updated_at") SELECT "id", "entry_id", "user_id", "text", "image", "score", "created_at", "updated_at" FROM `comment`;--> statement-breakpoint
DROP TABLE `comment`;--> statement-breakpoint
ALTER TABLE `__new_comment` RENAME TO `comment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_comment_vote` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comment_vote`("id", "comment_id", "user_id", "value", "created_at", "updated_at") SELECT "id", "comment_id", "user_id", "value", "created_at", "updated_at" FROM `comment_vote`;--> statement-breakpoint
DROP TABLE `comment_vote`;--> statement-breakpoint
ALTER TABLE `__new_comment_vote` RENAME TO `comment_vote`;--> statement-breakpoint
CREATE TABLE `__new_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`dictionary_id` text NOT NULL,
	`word` text NOT NULL,
	`translation` text,
	`part_of_speech` text,
	`pronunciation` text,
	`example` text,
	`notes` text,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`dictionary_id`) REFERENCES `dictionary`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry`("id", "dictionary_id", "word", "translation", "part_of_speech", "pronunciation", "example", "notes", "score", "created_at", "updated_at") SELECT "id", "dictionary_id", "word", "translation", "part_of_speech", "pronunciation", "example", "notes", "score", "created_at", "updated_at" FROM `entry`;--> statement-breakpoint
DROP TABLE `entry`;--> statement-breakpoint
ALTER TABLE `__new_entry` RENAME TO `entry`;--> statement-breakpoint
CREATE TABLE `__new_entry_tag` (
	`entry_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_tag`("entry_id", "tag_id") SELECT "entry_id", "tag_id" FROM `entry_tag`;--> statement-breakpoint
DROP TABLE `entry_tag`;--> statement-breakpoint
ALTER TABLE `__new_entry_tag` RENAME TO `entry_tag`;--> statement-breakpoint
CREATE TABLE `__new_entry_vote` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_vote`("id", "entry_id", "user_id", "value", "created_at", "updated_at") SELECT "id", "entry_id", "user_id", "value", "created_at", "updated_at" FROM `entry_vote`;--> statement-breakpoint
DROP TABLE `entry_vote`;--> statement-breakpoint
ALTER TABLE `__new_entry_vote` RENAME TO `entry_vote`;