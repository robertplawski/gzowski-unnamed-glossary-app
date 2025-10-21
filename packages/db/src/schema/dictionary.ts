import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const dictionary = sqliteTable("dictionary", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const entry = sqliteTable("entry", {
	id: text("id").primaryKey(),
	dictionaryId: text("dictionary_id")
		.notNull()
		.references(() => dictionary.id),
	word: text("word").notNull(),
	translation: text("translation"),
	partOfSpeech: text("part_of_speech"),
	pronunciation: text("pronunciation"),
	example: text("example"),
	notes: text("notes"),
	score: integer("score").default(0).notNull(), // total upvotes - downvotes
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const tag = sqliteTable("tag", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const entryTag = sqliteTable("entry_tag", {
	entryId: text("entry_id")
		.notNull()
		.references(() => entry.id),
	tagId: text("tag_id")
		.notNull()
		.references(() => tag.id),
});

// Users can comment on entries
export const comment = sqliteTable("comment", {
	id: text("id").primaryKey(),
	entryId: text("entry_id")
		.notNull()
		.references(() => entry.id),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	text: text("text").notNull(),
	image: text("image"), // optional image URL or path
	score: integer("score").default(0).notNull(), // total upvotes - downvotes
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Votes for entries (1 for upvote, -1 for downvote)
export const entryVote = sqliteTable("entry_vote", {
	id: text("id").primaryKey(),
	entryId: text("entry_id")
		.notNull()
		.references(() => entry.id),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	value: integer("value").notNull(), // +1 or -1
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Votes for comments
export const commentVote = sqliteTable("comment_vote", {
	id: text("id").primaryKey(),
	commentId: text("comment_id")
		.notNull()
		.references(() => comment.id),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	value: integer("value").notNull(), // +1 or -1
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
